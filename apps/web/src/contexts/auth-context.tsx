"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { getCurrentUser, getAccessToken, clearTokens, setTokens, setCurrentUser } from "@/lib/api";
import type { AuthUser } from "@/lib/api";

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: AuthUser, tokens: { accessToken: string; refreshToken: string }) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const u = getCurrentUser();
    const token = getAccessToken();
    setUser(u ? u : null);
    setIsLoading(false);
  }, []);

  const login = useCallback((u: AuthUser, tokens: { accessToken: string; refreshToken: string }) => {
    setTokens(tokens);
    setCurrentUser(u);
    setUser(u);
  }, []);

  const logout = useCallback(() => {
    clearTokens();
    setUser(null);
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
