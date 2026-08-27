"use client";

import {
  Activity,
  ArrowRight,
  Database,
  LoaderCircle,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useState } from "react";
import { useAuth } from "@/features/auth/auth-provider";
import { ApiError } from "@/lib/api/client";
import { safeInternalPath } from "@/lib/navigation";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { login, status } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "authenticated") {
      router.replace(safeInternalPath(params.get("next")));
    }
  }, [params, router, status]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await login(email.trim(), password);
      router.replace(safeInternalPath(params.get("next")));
    } catch (caught) {
      setError(
        caught instanceof ApiError && caught.status === 401
          ? "이메일 또는 비밀번호를 다시 확인해줘."
          : caught instanceof Error
            ? caught.message
            : "로그인하지 못했어. 잠시 후 다시 시도해줘.",
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
          placeholder="doctor.kim@patienty.local"
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
          placeholder="비밀번호를 입력해줘"
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
      <p className="text-center text-xs leading-5 text-slate-500">
        시연 계정은 프로젝트 README에서 확인할 수 있어.
        <br />
        인증 정보는 브라우저 저장소에 보관하지 않아.
      </p>
    </form>
  );
}

export default function LoginPage() {
  return (
    <main className="grid min-h-screen bg-[#eef4f4] lg:grid-cols-[1.05fr_.95fr]">
      <section className="relative hidden overflow-hidden bg-[#102a33] p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -right-32 -top-28 size-96 rounded-full bg-teal-400/10" />
        <div className="absolute -bottom-40 -left-24 size-[30rem] rounded-full bg-cyan-300/10" />
        <div className="relative flex items-center gap-3">
          <div className="grid size-11 place-items-center rounded-xl bg-teal-400 text-slate-950">
            <Activity className="size-7" strokeWidth={2.5} aria-hidden />
          </div>
          <div>
            <p className="text-xl font-black">Patienty</p>
            <p className="text-xs text-slate-400">Clinical Context Copilot</p>
          </div>
        </div>
        <div className="relative max-w-xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-teal-300/20 bg-teal-300/10 px-3 py-1.5 text-sm font-bold text-teal-200">
            <Sparkles className="size-4" aria-hidden />
            환자의 변화를 10초 안에
          </span>
          <h1 className="mt-6 text-5xl font-black leading-[1.15] tracking-tight">
            흩어진 기록을 모아
            <br />
            중요한 변화부터 보여줘.
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-8 text-slate-300">
            진료, 검사, 처방 기록을 한눈에 정리하고 모든 AI 설명을 원본
            근거까지 연결해.
          </p>
        </div>
        <div className="relative grid grid-cols-3 gap-3 text-sm">
          {[
            [Database, "구조화 기록"],
            [ShieldCheck, "근거 연결"],
            [LockKeyhole, "세션 보호"],
          ].map(([Icon, label]) => {
            const FeatureIcon = Icon as typeof Database;
            return (
              <div
                className="rounded-xl border border-white/10 bg-white/5 p-3"
                key={label as string}
              >
                <FeatureIcon className="mb-2 size-5 text-teal-300" aria-hidden />
                <p className="font-bold text-slate-200">{label as string}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="flex items-center justify-center p-5 sm:p-10">
        <div className="w-full max-w-md">
          <div className="mb-7 flex items-center gap-3 lg:hidden">
            <div className="grid size-10 place-items-center rounded-xl bg-[#102a33] text-teal-300">
              <Activity className="size-6" aria-hidden />
            </div>
            <p className="text-xl font-black text-slate-900">Patienty</p>
          </div>
          <div className="card p-6 sm:p-9">
            <span className="badge border-amber-200 bg-amber-50 text-amber-800">
              합성 데이터 전용 데모
            </span>
            <h2 className="mt-5 text-3xl font-black tracking-tight text-slate-950">
              다시 만나서 반가워!
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              담당 환자의 최근 변화를 확인하려면 로그인해줘.
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
