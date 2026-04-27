import type { ApiEnvelope, ApiError } from "@/shared/api/types";
import { clearTokens, getAccessToken, getRefreshToken, setTokens } from "@/shared/api/tokens";

const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL ?? "";

let refreshInFlight: Promise<boolean> | null = null;

function toApiError(status: number, body: unknown): ApiError {
  if (body && typeof body === "object" && "error" in body) {
    const err = (body as any).error;
    if (err && typeof err === "object" && typeof err.code === "string") {
      return { status, code: err.code, message: String(err.message ?? "Ошибка запроса"), details: err.details };
    }
  }
  return { status, code: "HTTP_ERROR", message: "Ошибка запроса", details: body };
}

async function parseEnvelope<T>(res: Response): Promise<T> {
  const text = await res.text();
  const json = text ? JSON.parse(text) : null;

  if (!res.ok) {
    throw toApiError(res.status, json);
  }

  const env = json as ApiEnvelope<T>;
  if (!env || typeof env !== "object") {
    throw { code: "BAD_RESPONSE", message: "Некорректный ответ сервера", details: json } satisfies ApiError;
  }
  if (env.success === false) {
    throw { ...(env.error ?? { code: "API_ERROR", message: "Ошибка API" }), status: res.status } satisfies ApiError;
  }
  return env.data;
}

async function doRefresh(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    const data = await parseEnvelope<{ access_token: string }>(res);
    setTokens(data.access_token, refreshToken);
    return true;
  } catch {
    clearTokens();
    return false;
  }
}

async function refreshOnce(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = doRefresh().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const token = getAccessToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (res.status === 401) {
    const ok = await refreshOnce();
    if (ok) {
      const retryHeaders: Record<string, string> = { "Content-Type": "application/json" };
      const retryToken = getAccessToken();
      if (retryToken) retryHeaders.Authorization = `Bearer ${retryToken}`;
      const retry = await fetch(`${API_BASE_URL}${path}`, {
        method,
        headers: retryHeaders,
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      return parseEnvelope<T>(retry);
    }
  }

  return parseEnvelope<T>(res);
}

export const api = {
  get: <T>(path: string) => request<T>("GET", path),
  post: <T>(path: string, body?: unknown) => request<T>("POST", path, body),
  patch: <T>(path: string, body?: unknown) => request<T>("PATCH", path, body),
  postForm: async <T>(path: string, form: FormData) => {
    const headers: Record<string, string> = {};
    const token = getAccessToken();
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(`${API_BASE_URL}${path}`, {
      method: "POST",
      headers,
      body: form,
    });

    if (res.status === 401) {
      const ok = await refreshOnce();
      if (ok) {
        const retryHeaders: Record<string, string> = {};
        const retryToken = getAccessToken();
        if (retryToken) retryHeaders.Authorization = `Bearer ${retryToken}`;
        const retry = await fetch(`${API_BASE_URL}${path}`, {
          method: "POST",
          headers: retryHeaders,
          body: form,
        });
        return parseEnvelope<T>(retry);
      }
    }

    return parseEnvelope<T>(res);
  },
};
