import { api } from "@/shared/api/client";

export const authApi = {
  async login(email: string, password: string) {
    const res = await api.post<{ access_token: string; refresh_token: string }>(
      "/api/v1/auth/login",
      { email, password },
    );
    return { accessToken: res.access_token, refreshToken: res.refresh_token };
  },

  async register(email: string, password: string) {
    await api.post("/api/v1/auth/register", { email, password });
  },

  async refresh(refreshToken: string) {
    const res = await api.post<{ access_token: string }>("/api/v1/auth/refresh", {
      refresh_token: refreshToken,
    });
    return { accessToken: res.access_token };
  },
};

