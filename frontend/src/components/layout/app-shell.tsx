"use client";

import {
  ChevronRight,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "@/features/auth/auth-provider";
import { formatRole } from "@/lib/format";
import { PageLoader } from "@/components/ui/states";
import { authApi } from "@/lib/api/client";

const navigation = [
  { href: "/", label: "대시보드", icon: LayoutDashboard },
  { href: "/patients", label: "환자 찾기", icon: Users },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { clinician, status, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const isLogin = pathname === "/login";

  useEffect(() => {
    if (!isLogin && status === "unauthenticated") {
      router.replace("/login");
    }
  }, [isLogin, router, status]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        const searchInput = document.getElementById("patient-search-input") as HTMLInputElement | null;
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        } else {
          router.push("/patients");
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router]);

  if (isLogin) return <>{children}</>;
  if (status === "loading") return <PageLoader label="의료진 세션을 확인하는 중" />;
  if (status === "unauthenticated" || !clinician) return null;

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  const nav = (
    <>
      <div className="flex h-20 items-center border-b border-slate-800 px-6">
        <p className="text-xl font-extrabold tracking-tight text-white">Patienty</p>
      </div>
      <nav className="flex-1 space-y-1.5 p-4" aria-label="주요 메뉴">
        {navigation.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              className={`flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold transition ${
                active
                  ? "bg-slate-800 text-white shadow-sm border border-slate-700/70"
                  : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
              }`}
              href={href}
              key={href}
              onClick={() => setMobileOpen(false)}
            >
              <Icon className={`size-4.5 ${active ? "text-slate-200" : "text-slate-400"}`} aria-hidden />
              {label}
              {active && <ChevronRight className="ml-auto size-4 text-slate-400" aria-hidden />}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-slate-800 p-4 space-y-1.5">
        <div className="mb-3 flex items-center gap-3 rounded-xl bg-slate-800/60 border border-slate-700/50 p-3">
          <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-slate-700 text-sm font-bold text-white">
            {clinician.name.slice(0, 1)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-white">
              {clinician.name}
            </p>
            <p className="truncate text-xs text-slate-400">
              {formatRole(clinician.role)}
            </p>
          </div>
        </div>
        <button
          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition"
          onClick={() => setPasswordModalOpen(true)}
          type="button"
        >
          <KeyRound className="size-4" aria-hidden />
          비밀번호 변경
        </button>
        <button
          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition"
          onClick={handleLogout}
          type="button"
        >
          <LogOut className="size-4" aria-hidden />
          로그아웃
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 print:bg-white print:p-0">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col bg-[#0f172a] border-r border-slate-800 lg:flex print:hidden">
        {nav}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden print:hidden">
          <button
            aria-label="메뉴 닫기"
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs"
            onClick={() => setMobileOpen(false)}
            type="button"
          />
          <aside className="relative flex h-full w-72 flex-col bg-[#0f172a] shadow-2xl">
            <button
              aria-label="메뉴 닫기"
              className="absolute right-3 top-3 rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
              onClick={() => setMobileOpen(false)}
              type="button"
            >
              <X className="size-5" />
            </button>
            {nav}
          </aside>
        </div>
      )}

      <div className="lg:pl-64 print:pl-0">
        <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur print:hidden">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
            <button
              aria-label="메뉴 열기"
              className="rounded-xl border border-slate-200 p-2 text-slate-600 lg:hidden"
              onClick={() => setMobileOpen(true)}
              type="button"
            >
              <Menu className="size-5" />
            </button>
            <Link
              className="hidden max-w-md flex-1 items-center justify-between gap-2 rounded-xl border border-slate-200/90 bg-slate-50/80 px-3.5 py-2 text-sm text-slate-400 transition hover:border-slate-300 hover:bg-white hover:text-slate-600 sm:flex"
              href="/patients"
            >
              <div className="flex items-center gap-2">
                <Search className="size-4 text-slate-400" aria-hidden />
                <span>이름 또는 환자번호로 찾기</span>
              </div>
              <kbd className="inline-flex items-center rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-400">
                Ctrl+K
              </kbd>
            </Link>
            <div className="ml-auto flex items-center gap-3 text-right">
              <div className="hidden sm:block">
                <p className="text-sm font-bold text-slate-900">{clinician.name}</p>
                <p className="text-xs text-slate-400">{clinician.email}</p>
              </div>
              <ShieldCheck className="size-5 text-slate-700" aria-label="인증됨" />
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-[1600px] p-4 sm:p-6 lg:p-8 print:p-0 print:max-w-none">
          {children}
        </main>
      </div>

      {passwordModalOpen && (
        <ChangePasswordModal onClose={() => setPasswordModalOpen(false)} />
      )}
    </div>
  );
}

function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setError("새 비밀번호는 6자 이상이어야 합니다.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("새 비밀번호 확인이 일치하지 않습니다.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      await authApi.changePassword(currentPassword, newPassword);
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "비밀번호 변경에 실패했습니다. 현재 비밀번호를 확인해 주세요.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4" role="dialog">
      <div className="card max-w-md w-full p-6 space-y-4 shadow-2xl bg-white border border-slate-200">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <KeyRound className="size-5 text-slate-700" />
            <h2 className="text-base font-bold text-slate-900">비밀번호 변경</h2>
          </div>
          <button
            aria-label="닫기"
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            onClick={onClose}
            type="button"
          >
            <X className="size-4.5" />
          </button>
        </div>

        {success ? (
          <div className="rounded-xl border border-teal-200 bg-teal-50 p-4 text-center text-sm font-bold text-teal-900">
            비밀번호가 성공적으로 변경되었습니다!
          </div>
        ) : (
          <form className="space-y-4" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">
                {error}
              </div>
            )}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700" htmlFor="curr-pass">
                현재 비밀번호
              </label>
              <input
                className="field text-sm"
                id="curr-pass"
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                type="password"
                value={currentPassword}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700" htmlFor="new-pass">
                새 비밀번호 (6자 이상)
              </label>
              <input
                className="field text-sm"
                id="new-pass"
                minLength={6}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                type="password"
                value={newPassword}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700" htmlFor="conf-pass">
                새 비밀번호 확인
              </label>
              <input
                className="field text-sm"
                id="conf-pass"
                minLength={6}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                type="password"
                value={confirmPassword}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                className="button-secondary text-xs"
                onClick={onClose}
                type="button"
              >
                취소
              </button>
              <button
                className="button-primary text-xs"
                disabled={loading || !currentPassword || !newPassword || !confirmPassword}
                type="submit"
              >
                {loading ? "변경 중..." : "비밀번호 저장"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

