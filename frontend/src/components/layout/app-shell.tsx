"use client";

import {
  ChevronRight,
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
import { useEffect, useState } from "react";
import { useAuth } from "@/features/auth/auth-provider";
import { formatRole } from "@/lib/format";
import { PageLoader } from "@/components/ui/states";

const navigation = [
  { href: "/", label: "대시보드", icon: LayoutDashboard },
  { href: "/patients", label: "환자 찾기", icon: Users },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { clinician, status, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isLogin = pathname === "/login";

  useEffect(() => {
    if (!isLogin && status === "unauthenticated") {
      router.replace("/login");
    }
  }, [isLogin, router, status]);

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
      <div className="border-t border-slate-800 p-4">
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
    <div className="min-h-screen bg-[#f8fafc] text-slate-900">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col bg-[#0f172a] border-r border-slate-800 lg:flex">
        {nav}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
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

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur">
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
              className="hidden max-w-md flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500 transition hover:border-teal-400 hover:bg-white sm:flex"
              href="/patients"
            >
              <Search className="size-4" aria-hidden />
              이름 또는 환자번호로 찾기
            </Link>
            <div className="ml-auto flex items-center gap-2 text-right">
              <div className="hidden sm:block">
                <p className="text-sm font-bold text-slate-800">{clinician.name}</p>
                <p className="text-xs text-slate-500">{clinician.email}</p>
              </div>
              <ShieldCheck className="size-5 text-teal-600" aria-label="인증됨" />
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-[1600px] p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
