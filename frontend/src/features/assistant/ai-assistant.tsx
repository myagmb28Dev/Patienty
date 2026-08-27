"use client";

import {
  AlertCircle,
  ExternalLink,
  FileSearch,
  FileText,
  LoaderCircle,
  MessageSquareText,
  RotateCcw,
  Send,
  ShieldAlert,
} from "lucide-react";
import { FormEvent, useState } from "react";
import { patientsApi } from "@/lib/api/client";
import type { AiResponse } from "@/lib/api/types";
import { formatDateTime } from "@/lib/format";

const suggestedQuestions = [
  "지난 진료 이후 변경된 사항은?",
  "최근 6개월간 검사 수치 변화는?",
  "현재 복용 중인 약물 정리",
  "최근 진료 이력 시간순 정리",
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const ask = async (value: string) => {
    const clean = value.trim();
    if (!clean || loading) return;
    setQuestion(clean);
    setLastQuestion(clean);
    setLoading(true);
    setError("");

    try {
      setResponse(await patientsApi.ask(patientId, clean));
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "기록 요약 조회를 완료하지 못했습니다. 원본 기록은 계속 확인하실 수 있습니다.",
      );
    } finally {
      setLoading(false);
    }
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void ask(question);
  };

  return (
    <aside className="card flex min-h-[620px] flex-col overflow-hidden xl:sticky xl:top-32 xl:max-h-[calc(100vh-9rem)]">
      <header className="border-b border-slate-200 bg-[#102a33] p-5 text-white">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-teal-400 text-slate-950">
              <FileSearch className="size-5" aria-hidden />
            </div>
            <div>
              <h2 className="font-black">AI 임상 기록 질의</h2>
              <p className="text-xs text-slate-300">의무기록 기반 AI 데이터 분석 및 근거 검색</p>
            </div>
          </div>
          <span className="badge border-teal-400/40 bg-teal-500/20 text-xs font-bold text-teal-200">
            AI 분석 기능
          </span>
        </div>
      </header>

      <div className="flex-1 space-y-5 overflow-y-auto p-4 sm:p-5">
        {!response && !loading && !error && (
          <div>
            <div className="rounded-2xl border border-teal-100 bg-teal-50/70 p-4">
              <FileText className="size-5 text-teal-700" aria-hidden />
              <p className="mt-2 text-sm font-bold text-slate-900">
                확인할 임상 항목을 선택하세요 (AI 분석)
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-600">
                주요 조회 항목을 선택하거나 질문을 입력하면 환자의 진료·검사·처방 기록을 AI가 분석하여 답변과 원본 근거를 연결합니다.
              </p>
            </div>
            <div className="mt-4 space-y-2">
              <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                주요 조회 항목
              </p>
              {suggestedQuestions.map((suggestion) => (
                <button
                  className="flex w-full items-center gap-2 rounded-xl border border-slate-200 bg-white p-3 text-left text-sm font-semibold text-slate-700 transition hover:border-teal-300 hover:bg-teal-50"
                  key={suggestion}
                  onClick={() => void ask(suggestion)}
                  type="button"
                >
                  <MessageSquareText className="size-4 shrink-0 text-teal-700" aria-hidden />
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {loading && (
          <div className="flex min-h-52 flex-col items-center justify-center text-center" role="status">
            <LoaderCircle className="size-7 animate-spin text-teal-700" aria-hidden />
            <p className="mt-3 text-sm font-bold text-slate-800">
              필요한 기록을 선별하는 중
            </p>
            <p className="mt-1 text-xs text-slate-500">
              진료·검사·처방 근거를 확인하고 있습니다.
            </p>
          </div>
        )}

        {error && !loading && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4" role="alert">
            <AlertCircle className="size-5 text-rose-600" aria-hidden />
            <p className="mt-2 text-sm font-bold text-slate-900">답변 생성 실패</p>
            <p className="mt-1 text-xs leading-5 text-slate-600">{error}</p>
            <button
              className="button-secondary mt-3"
              onClick={() => void ask(lastQuestion)}
              type="button"
            >
              <RotateCcw className="size-4" aria-hidden />
              다시 시도
            </button>
          </div>
        )}

        {response && !loading && (
          <AiAnswer response={response} onEvidence={onEvidence} />
        )}
      </div>

      <form className="border-t border-slate-200 bg-slate-50 p-4" onSubmit={submit}>
        <label className="sr-only" htmlFor="patient-question">
          환자 기록에 대해 질문
        </label>
        <textarea
          className="field min-h-20 resize-none py-3"
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
        <div className="mt-2 flex items-center justify-between gap-3">
          <p className="text-[11px] leading-4 text-slate-500">
            조회된 요약은 참고용이며 원본 의무기록을 확인하세요.
          </p>
          <button
            aria-label="질문 보내기"
            className="button-primary shrink-0"
            disabled={!question.trim() || loading}
            type="submit"
          >
            <Send className="size-4" aria-hidden />
            보내기
          </button>
        </div>
      </form>
    </aside>
  );
}

function AiAnswer({
  response,
  onEvidence,
}: {
  response: AiResponse;
  onEvidence: (evidenceId: string) => void;
}) {
  const unsupported = response.status === "UNSUPPORTED_REQUEST";
  const insufficient = response.status === "INSUFFICIENT_EVIDENCE";

  return (
    <div className="space-y-4">
      <div
        className={
          "rounded-2xl border p-4 " +
          (unsupported
            ? "border-slate-300 bg-slate-50"
            : insufficient
              ? "border-amber-200 bg-amber-50"
              : "border-teal-200 bg-teal-50")
        }
      >
        {unsupported ? (
          <ShieldAlert className="size-5 text-slate-600" aria-hidden />
        ) : insufficient ? (
          <AlertCircle className="size-5 text-amber-700" aria-hidden />
        ) : (
          <FileText className="size-5 text-teal-700" aria-hidden />
        )}
        <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-800">
          {response.answer}
        </p>
      </div>

      {response.observations.length > 0 && (
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-slate-400">
            확인된 변화
          </p>
          <div className="mt-2 space-y-2">
            {response.observations.map((observation, index) => (
              <div
                className="rounded-xl border border-slate-200 bg-white p-3"
                key={observation.type + "-" + index}
              >
                <p className="text-sm font-semibold leading-5 text-slate-800">
                  {observation.text}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {observation.evidenceIds.map((id) => {
                    const evidence = response.evidence.find((item) => item.id === id);
                    return (
                      <button
                        className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-600 hover:bg-teal-100 hover:text-teal-800"
                        key={id}
                        onClick={() => onEvidence(id)}
                        type="button"
                      >
                        <ExternalLink className="size-3" aria-hidden />
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
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-slate-400">
            사용한 근거
          </p>
          <div className="mt-2 space-y-1.5">
            {response.evidence.map((evidence) => (
              <button
                className="flex w-full items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 text-left transition hover:border-teal-300"
                key={evidence.id}
                onClick={() => onEvidence(evidence.id)}
                type="button"
              >
                <span className="min-w-0">
                  <span className="block truncate text-xs font-bold text-slate-700">
                    {evidence.label}
                  </span>
                  <span className="mt-0.5 block text-[11px] text-slate-400">
                    {formatDateTime(evidence.occurredAt)}
                  </span>
                </span>
                <ExternalLink className="size-4 shrink-0 text-teal-700" aria-hidden />
              </button>
            ))}
          </div>
        </div>
      )}

      <p className="text-right text-[11px] text-slate-400">
        {formatDateTime(response.generatedAt)} 생성
      </p>
    </div>
  );
}
