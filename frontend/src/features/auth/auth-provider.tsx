"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { authApi } from "@/lib/api/client";
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

const SESSION_HINT_KEY = "patienty:has_session";
const sessionListeners = new Set<() => void>();

function notifySessionListeners() {
  sessionListeners.forEach((listener) => listener());
}

function hasSessionHint(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(SESSION_HINT_KEY) === "1";
  } catch {
    return false;
  }
}

function subscribeSessionHint(callback: () => void) {
  sessionListeners.add(callback);
  const handleStorage = (e: StorageEvent) => {
    if (e.key === SESSION_HINT_KEY) {
      callback();
    }
  };
  window.addEventListener("storage", handleStorage);
  return () => {
    sessionListeners.delete(callback);
    window.removeEventListener("storage", handleStorage);
  };
}

function setSessionHint(hasSession: boolean) {
  if (typeof window === "undefined") return;
  try {
    if (hasSession) {
      window.localStorage.setItem(SESSION_HINT_KEY, "1");
    } else {
      window.localStorage.removeItem(SESSION_HINT_KEY);
    }
  } catch {
  }
  notifySessionListeners();
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [clinician, setClinician] = useState<Clinician | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const [sessionExpired, setSessionExpired] = useState(false);

  const hasSession = useSyncExternalStore(
    subscribeSessionHint,
    hasSessionHint,
    () => true,
  );

  const isLogin = pathname === "/login";

  const refresh = useCallback(async () => {
    if (pathname === "/login" || !hasSessionHint()) {
      setClinician(null);
      return;
    }
    setRefreshing(true);
    try {
      const current = await authApi.me();
      setClinician(current);
    } catch {
      setSessionHint(false);
      setClinician(null);
    } finally {
      setRefreshing(false);
    }
  }, [pathname]);

  useEffect(() => {
    if (isLogin || !hasSession) {
      return;
    }
    let cancelled = false;
    authApi.me()
      .then((current) => {
        if (!cancelled) {
          setClinician(current);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSessionHint(false);
          setClinician(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isLogin, hasSession]);

  useEffect(() => {
    const handleUnauthorized = () => {
      setSessionHint(false);
      setClinician(null);
      if (pathname !== "/login") {
        setSessionExpired(true);
      }
    };
    window.addEventListener("patienty:unauthorized", handleUnauthorized);
    return () =>
      window.removeEventListener("patienty:unauthorized", handleUnauthorized);
  }, [pathname]);

  const login = useCallback(async (email: string, password: string) => {
    const current = await authApi.login(email, password);
    setSessionHint(true);
    setClinician(current);
    setSessionExpired(false);
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      setSessionHint(false);
      setClinician(null);
      setSessionExpired(false);
      if (clinician) clearRecentPatients(clinician.id);
    }
  }, [clinician]);

  const status: AuthStatus = useMemo(() => {
    if (isLogin) return "unauthenticated";
    if (!hasSession) return "unauthenticated";
    if (clinician) return "authenticated";
    if (refreshing) return "loading";
    return "loading";
  }, [isLogin, hasSession, clinician, refreshing]);

  const value = useMemo(
    () => ({ clinician, status, login, logout, refresh }),
    [clinician, status, login, logout, refresh],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
      {sessionExpired && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4" role="alertdialog">
          <div className="card max-w-sm w-full p-6 text-center space-y-4 shadow-2xl bg-white border border-slate-200">
            <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-amber-100 text-amber-700">
              <span className="text-xl font-bold">!</span>
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">로그인 세션 만료</h2>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
                보안을 위해 일정 시간 동안 활동이 없어 세션이 만료되었습니다. 다시 로그인해 주세요.
              </p>
            </div>
            <button
              className="button-primary w-full justify-center text-sm py-2.5"
              onClick={() => {
                setSessionExpired(false);
                router.push("/login");
              }}
              type="button"
            >
              로그인 페이지로 이동
            </button>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider.");
  return value;
}

