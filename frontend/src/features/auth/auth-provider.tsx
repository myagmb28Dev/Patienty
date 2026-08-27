"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { authApi, ApiError } from "@/lib/api/client";
import type { Clinician } from "@/lib/api/types";
import { clearRecentPatients } from "@/lib/recent-patients";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

interface AuthContextValue {
  clinician: Clinician | null;
  status: AuthStatus;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [clinician, setClinician] = useState<Clinician | null>(null);
  const pathname = usePathname();
  const [status, setStatus] = useState<AuthStatus>(() =>
    pathname === "/login" ? "unauthenticated" : "loading"
  );

  const refresh = useCallback(async () => {
    try {
      const current = await authApi.me();
      setClinician(current);
      setStatus("authenticated");
    } catch {
      setClinician(null);
      setStatus("unauthenticated");
    }
  }, []);

  useEffect(() => {
    if (pathname === "/login") {
      setStatus("unauthenticated");
      return;
    }
    const frame = window.requestAnimationFrame(() => void refresh());
    return () => window.cancelAnimationFrame(frame);
  }, [pathname, refresh]);

  useEffect(() => {
    const handleUnauthorized = () => {
      setClinician(null);
      setStatus("unauthenticated");
    };
    window.addEventListener("patienty:unauthorized", handleUnauthorized);
    return () =>
      window.removeEventListener("patienty:unauthorized", handleUnauthorized);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const current = await authApi.login(email, password);
    setClinician(current);
    setStatus("authenticated");
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      setClinician(null);
      setStatus("unauthenticated");
      if (clinician) clearRecentPatients(clinician.id);
    }
  }, [clinician]);

  const value = useMemo(
    () => ({ clinician, status, login, logout, refresh }),
    [clinician, status, login, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider.");
  return value;
}
