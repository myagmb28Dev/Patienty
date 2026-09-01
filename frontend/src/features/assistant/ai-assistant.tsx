"use client";

import {
  AlertCircle,
  Clock,
  ExternalLink,
  FileSearch,
  FileText,
  LoaderCircle,
  Pill,
  RotateCcw,
  Search,
  ShieldAlert,
  TrendingUp,
} from "lucide-react";
import { FormEvent, useState } from "react";
import { patientsApi } from "@/lib/api/client";
import type { AiResponse } from "@/lib/api/types";
import { formatDateTime } from "@/lib/format";

const suggestedQueries = [
  { label: "지난 진료 이후 변경 사항", icon: Clock, query: "지난 진료 이후 변경된 사항은?" },
  { label: "최근 6개월 검사 수치 추이", icon: TrendingUp, query: "최근 6개월간 검사 수치 변화는?" },
  { label: "현재 유지 중인 처방 약물", icon: Pill, query: "현재 복용 중인 약물 정리" },
  { label: "전체 진료 이력 시간순 정돈", icon: FileText, query: "최근 진료 이력 시간순 정리" },
];

export function AiAssistant({
  patientId,
  onEvidence,
}: {
  patientId: string;
  onEvidence: (evidenceId: string) => void;
}) {
  const [question, setQuestion] = useState("");
  const [lastQuestion, setLastQuestion] = useState("");
  const [response, setResponse] = useState<AiResponse | null>(null);
  const [streamingText, setStreamingText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const ask = async (value: string) => {
    const clean = value.trim();
    if (!clean || loading) return;
    setQuestion(clean);
    setLastQuestion(clean);
    setLoading(true);
    setStreamingText("");
    setResponse(null);
    setError("");

    try {
      const res = await patientsApi.askStream(patientId, clean, (chunk) => {
        setStreamingText((prev) => prev + chunk);
      });
      setResponse(res);
      setStreamingText("");
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "의무기록 조회를 완료하지 못했습니다. 원본 기록은 계속 확인하실 수 있습니다.",
      );
    } finally {
      setLoading(false);
      setStreamingText("");
    }
  };


  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void ask(question);
  };

  return (
    <aside className="card flex h-[calc(100vh-6rem)] flex-col overflow-hidden xl:sticky xl:top-20">
      <header className="shrink-0 border-b border-slate-800 bg-slate-900 p-4 text-white">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="grid size-8 place-items-center rounded-lg bg-slate-800 border border-slate-700 text-slate-200">
              <FileSearch className="size-4" aria-hidden />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight text-white">임상 의무기록 조회</h2>
              <p className="text-[11px] text-slate-400">진료·검사·처방 기반 요약 검색</p>
            </div>
          </div>
          <span className="badge border-slate-700 bg-slate-800/80 text-[10px] font-medium text-slate-300">
            데이터 분석
          </span>
        </div>
      </header>

      <div className="min-h-0 flex-1 space-y-3.5 overflow-y-auto p-4">
        {!response && !loading && !error && (
          <div className="space-y-3">
            <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5">
              <p className="text-xs font-bold text-slate-800">
                의무기록 항목별 빠른 조회
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
                조회할 항목을 선택하거나 하단에 검색어를 입력하면 환자의 진료·검사·처방 기록을 분석하여 핵심 요약과 원본 근거를 제공합니다.
              </p>
            </div>
            <div className="space-y-1.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                주요 조회 항목
              </p>
              {suggestedQueries.map(({ label, icon: Icon, query }) => (
                <button
                  className="flex w-full items-center gap-2.5 rounded-lg border border-slate-200/90 bg-white p-2.5 text-left transition hover:border-slate-300 hover:bg-slate-50 shadow-2xs"
                  key={query}
                  onClick={() => void ask(query)}
                  type="button"
                >
                  <div className="grid size-6 shrink-0 place-items-center rounded-md bg-slate-100 text-slate-600">
                    <Icon className="size-3" aria-hidden />
                  </div>
                  <span className="text-xs font-medium text-slate-700">{label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {loading && (
          <div className="space-y-3">
            {streamingText ? (
              <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
                <div className="flex items-center gap-2 mb-1.5 text-xs font-bold text-slate-700">
                  <FileText className="size-3.5 text-slate-600" aria-hidden />
                  <span>실시간 기록 분석 및 작성 중...</span>
                </div>
                <p className="whitespace-pre-wrap text-xs sm:text-sm leading-relaxed text-slate-800 font-medium">
                  {streamingText}
                  <span className="inline-block w-1.5 h-4 ml-0.5 bg-teal-600 animate-pulse align-middle" />
                </p>
              </div>
            ) : (
              <div className="flex min-h-52 flex-col items-center justify-center text-center" role="status">
                <LoaderCircle className="size-6 animate-spin text-slate-700" aria-hidden />
                <p className="mt-3 text-sm font-bold text-slate-800">
                  의무기록 분석 중
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  진료, 검사 결과, 처방 이력을 확인하고 있습니다.
                </p>
              </div>
            )}
          </div>
        )}


        {error && !loading && (
          <div className="rounded-xl border border-rose-200 bg-rose-50/80 p-4" role="alert">
            <AlertCircle className="size-5 text-rose-600" aria-hidden />
            <p className="mt-2 text-sm font-bold text-slate-900">기록 조회 실패</p>
            <p className="mt-1 text-xs leading-5 text-slate-600">{error}</p>
            <button
              className="button-secondary mt-3 text-xs"
              onClick={() => void ask(lastQuestion)}
              type="button"
            >
              <RotateCcw className="size-3.5" aria-hidden />
              다시 시도
            </button>
          </div>
        )}

        {response && !loading && (
          <AiAnswer response={response} onEvidence={onEvidence} onReset={() => setResponse(null)} />
        )}
      </div>

      <form className="shrink-0 border-t border-slate-200/80 bg-slate-50/95 p-3.5" onSubmit={submit}>
        <label className="sr-only" htmlFor="patient-question">
          임상 의무기록 검색
        </label>
        <div className="relative">
          <textarea
            className="field min-h-16 resize-none py-2 text-xs sm:text-sm"
            id="patient-question"
            maxLength={500}
            onChange={(event) => setQuestion(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void ask(question);
              }
            }}
            placeholder="예: 지난 진료 이후 달라진 점은?"
            value={question}
          />
        </div>
        <div className="mt-2 flex items-center justify-between gap-3">
          <p className="text-[10px] text-slate-400">
            의무기록 기반 참고용 분석
          </p>
          <button
            aria-label="기록 검색"
            className="button-primary shrink-0 text-xs px-3 py-1.5"
            disabled={!question.trim() || loading}
            type="submit"
          >
            <Search className="size-3.5" aria-hidden />
            조회하기
          </button>
        </div>
      </form>
    </aside>
  );
}

function AiAnswer({
  response,
  onEvidence,
  onReset,
}: {
  response: AiResponse;
  onEvidence: (evidenceId: string) => void;
  onReset: () => void;
}) {
  const unsupported = response.status === "UNSUPPORTED_REQUEST";
  const insufficient = response.status === "INSUFFICIENT_EVIDENCE";

  return (
    <div className="space-y-3.5">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          분석 요약 소견
        </span>
        <button
          className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
          onClick={onReset}
          type="button"
        >
          다른 항목 조회
        </button>
      </div>

      <div
        className={
          "rounded-xl border p-3.5 shadow-2xs " +
          (unsupported
            ? "border-slate-200 bg-slate-50/80"
            : insufficient
              ? "border-amber-200 bg-amber-50/70"
              : "border-slate-200 bg-white")
        }
      >
        <div className="flex items-center gap-2 mb-1.5 text-xs font-bold text-slate-700">
          {unsupported ? (
            <ShieldAlert className="size-3.5 text-slate-500" aria-hidden />
          ) : insufficient ? (
            <AlertCircle className="size-3.5 text-amber-700" aria-hidden />
          ) : (
            <FileText className="size-3.5 text-slate-600" aria-hidden />
          )}
          <span>임상 소견 요약</span>
        </div>
        <p className="whitespace-pre-wrap text-xs sm:text-sm leading-relaxed text-slate-800 font-medium">
          {response.answer}
        </p>
      </div>

      {response.observations.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            주요 감지 변화
          </p>
          <div className="space-y-2">
            {response.observations.map((observation, index) => (
              <div
                className="rounded-xl border border-slate-200 bg-white p-3 shadow-2xs"
                key={observation.type + "-" + index}
              >
                <p className="text-xs font-semibold leading-5 text-slate-800">
                  {observation.text}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5 pt-1.5 border-t border-slate-100">
                  {observation.evidenceIds.map((id) => {
                    const evidence = response.evidence.find((item) => item.id === id);
                    return (
                      <button
                        className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-700 transition hover:bg-slate-100"
                        key={id}
                        onClick={() => onEvidence(id)}
                        type="button"
                      >
                        <ExternalLink className="size-2.5 text-slate-400" aria-hidden />
                        {evidence?.label ?? "근거 기록"}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {response.evidence.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            참조한 의무기록 근거
          </p>
          <div className="space-y-1.5">
            {response.evidence.map((evidence) => (
              <button
                className="flex w-full items-center justify-between gap-3 rounded-lg border border-slate-200/90 bg-white p-2.5 text-left transition hover:border-slate-300 hover:bg-slate-50/80 shadow-2xs"
                key={evidence.id}
                onClick={() => onEvidence(evidence.id)}
                type="button"
              >
                <span className="min-w-0">
                  <span className="block truncate text-xs font-semibold text-slate-800">
                    {evidence.label}
                  </span>
                  <span className="mt-0.5 block text-[10px] text-slate-400">
                    {formatDateTime(evidence.occurredAt)}
                  </span>
                </span>
                <ExternalLink className="size-3.5 shrink-0 text-slate-400" aria-hidden />
              </button>
            ))}
          </div>
        </div>
      )}

      <p className="text-right text-[10px] text-slate-400">
        {formatDateTime(response.generatedAt)} 조회 기준
      </p>
    </div>
  );
}

