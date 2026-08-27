"use client";

import {
  Activity,
  ArrowRight,
  ClipboardList,
  HeartPulse,
  LoaderCircle,
  Pill,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, Suspense, useEffect, useState } from "react";
import { useAuth } from "@/features/auth/auth-provider";
import { ApiError } from "@/lib/api/client";

function LoginForm() {
  const router = useRouter();
  const { login, status } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/");
    }
  }, [router, status]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await login(email.trim(), password);
      router.replace("/");
    } catch (caught) {
      setError(
        caught instanceof ApiError && caught.status === 401
          ? "이메일 또는 비밀번호를 다시 확인해 주세요."
          : caught instanceof Error
            ? caught.message
            : "로그인에 실패했습니다. 잠시 후 다시 시도해 주세요.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
      <div>
        <label className="mb-2 block text-sm font-bold text-slate-700" htmlFor="email">
          이메일
        </label>
        <input
          autoComplete="username"
          className="field"
          id="email"
          onChange={(event) => setEmail(event.target.value)}
          placeholder="이메일을 입력하세요"
          required
          type="email"
          value={email}
        />
      </div>
      <div>
        <label className="mb-2 block text-sm font-bold text-slate-700" htmlFor="password">
          비밀번호
        </label>
        <input
          autoComplete="current-password"
          className="field"
          id="password"
          minLength={8}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="비밀번호를 입력하세요"
          required
          type="password"
          value={password}
        />
      </div>
      {error && (
        <p
          className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700"
          role="alert"
        >
          {error}
        </p>
      )}
      <button
        className="button-primary w-full py-3"
        disabled={submitting || status === "loading"}
        type="submit"
      >
        {submitting ? (
          <>
            <LoaderCircle className="size-4 animate-spin" aria-hidden />
            로그인하는 중
          </>
        ) : (
          <>
            로그인
            <ArrowRight className="size-4" aria-hidden />
          </>
        )}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <main className="grid min-h-screen bg-slate-50/60 lg:grid-cols-[1.1fr_.9fr]">
      <section className="relative hidden overflow-hidden border-r border-slate-800 bg-[#0f172a] p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute -right-24 -top-24 size-[26rem] rounded-full bg-teal-500/15 blur-2xl animate-orb-1" />
        <div className="pointer-events-none absolute -right-36 -top-36 size-[32rem] rounded-full border border-teal-500/15 animate-ring-slow" />
        <div className="pointer-events-none absolute -bottom-36 -left-24 size-[32rem] rounded-full bg-slate-700/30 blur-3xl animate-orb-2" />
        <div className="pointer-events-none absolute -bottom-48 -left-36 size-[40rem] rounded-full border border-white/5 animate-ring-slow" />
        <div className="pointer-events-none absolute top-1/2 left-1/3 size-64 -translate-y-1/2 rounded-full bg-cyan-500/10 blur-2xl animate-orb-glow" />
        
        <div className="relative">
          <p className="text-xl font-bold tracking-tight text-white">Patienty</p>
        </div>

        <div className="relative max-w-xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800/80 px-3.5 py-1.5 text-xs font-medium text-slate-300">
            <Activity className="size-3.5 text-slate-300" aria-hidden />
            환자의 변화를 10초 안에
          </span>
          <h1 className="mt-6 text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl xl:text-5xl break-keep">
            흩어진 기록을 모아
            <br />
            중요한 변화부터 확인하세요.
          </h1>
          <p className="mt-5 text-base leading-relaxed text-slate-400 break-keep">
            진료, 검사, 처방 기록을 한눈에 정리하고
            <br />
            모든 요약과 분석을 원본 근거 기록까지 연결합니다.
          </p>
        </div>

        <div className="relative grid grid-cols-3 gap-3 text-xs">
          {[
            [ClipboardList, "임상 진료 기록"],
            [HeartPulse, "검사 수치 추이"],
            [Pill, "약물 처방 내역"],
          ].map(([Icon, label]) => {
            const FeatureIcon = Icon as typeof ClipboardList;
            return (
              <div
                className="rounded-xl border border-slate-800 bg-slate-850/60 bg-slate-800/50 p-3.5"
                key={label as string}
              >
                <FeatureIcon className="mb-2 size-4 text-slate-300" aria-hidden />
                <p className="font-semibold text-slate-200">{label as string}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <p className="text-xl font-bold tracking-tight text-slate-900">Patienty</p>
          </div>
          <div className="card p-7 sm:p-10 shadow-xs border border-slate-200/90 bg-white rounded-2xl">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              의료진 로그인
            </h2>
            <p className="mt-1.5 text-xs text-slate-500">
              담당 환자의 최근 변화를 확인하려면 로그인해 주세요.
            </p>
            <Suspense fallback={<div className="mt-8 h-64 animate-pulse rounded-xl bg-slate-100" />}>
              <LoginForm />
            </Suspense>
          </div>
        </div>
      </section>
    </main>
  );
}
