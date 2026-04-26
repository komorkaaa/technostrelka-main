import React, { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { authApi } from "@/features/auth/api/authApi";
import { clearTokens, getRefreshToken, setTokens } from "@/shared/api/tokens";
import { userApi } from "@/entities/user/api";
import type { User } from "@/entities/user/model";
import type { ApiError } from "@/shared/api/types";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

type AuthContextValue = {
  status: AuthStatus;
  user: User | null;
  error: ApiError | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshSession: () => Promise<boolean>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<ApiError | null>(null);

  const refreshSession = useCallback(async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return false;
    try {
      const refreshed = await authApi.refresh(refreshToken);
      setTokens(refreshed.accessToken, refreshToken);
      const me = await userApi.getMe();
      setUser(me);
      setStatus("authenticated");
      setError(null);
      return true;
    } catch (e) {
      clearTokens();
      setUser(null);
      setStatus("unauthenticated");
      setError(e as ApiError);
      return false;
    }
  }, []);

  useEffect(() => {
    void (async () => {
      const ok = await refreshSession();
      if (!ok) {
        setStatus("unauthenticated");
      }
    })();
  }, [refreshSession]);

  const login = useCallback(async (email: string, password: string) => {
    setError(null);
    const tokens = await authApi.login(email, password);
    setTokens(tokens.accessToken, tokens.refreshToken);
    const me = await userApi.getMe();
    setUser(me);
    setStatus("authenticated");
  }, []);

  const register = useCallback(async (email: string, password: string) => {
    setError(null);
    await authApi.register(email, password);
    await login(email, password);
  }, [login]);

  const logout = useCallback(() => {
    clearTokens();
    setUser(null);
    setStatus("unauthenticated");
    setError(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ status, user, error, login, register, logout, refreshSession }),
    [status, user, error, login, register, logout, refreshSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

