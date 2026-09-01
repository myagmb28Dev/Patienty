"use client";

import {
  Activity,
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ClipboardList,
  ExternalLink,
  FileText,
  FlaskConical,
  HeartPulse,
  Pill,
  Printer,
  Sparkles,
} from "lucide-react";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { AiAssistant } from "@/features/assistant/ai-assistant";
import { useAuth } from "@/features/auth/auth-provider";
import { EmptyState, ErrorState, SectionSkeleton } from "@/components/ui/states";
import { evidenceTargetId, focusEvidence } from "@/features/patients/evidence";
import { MeasurementTrends } from "@/features/patients/measurement-trends";
import { patientsApi } from "@/lib/api/client";
import type {
  MeasurementSeries,
  PatientDetail,
  PrescriptionItem,
  TimelineItem,
} from "@/lib/api/types";
import {
  formatDate,
  formatDateTime,
  formatSex,
} from "@/lib/format";
import { rememberPatient } from "@/lib/recent-patients";

export function PatientDetailPage() {
  const params = useParams<{ patientId: string }>();
  const patientId = params.patientId;
  const { clinician } = useAuth();
  const [detail, setDetail] = useState<PatientDetail | null>(null);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [measurements, setMeasurements] = useState<MeasurementSeries[]>([]);
  const [partialFailures, setPartialFailures] = useState<string[]>([]);
  const [evidenceNotice, setEvidenceNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    setPartialFailures([]);

    const [detailResult, timelineResult, measurementResult] =
      await Promise.allSettled([
        patientsApi.detail(patientId),
        patientsApi.timeline(patientId),
        patientsApi.measurements(patientId),
      ]);

    if (detailResult.status === "rejected") {
      setError(
        detailResult.reason instanceof Error
          ? detailResult.reason.message
          : "환자 기록을 불러오지 못했습니다.",
      );
      setLoading(false);
      return;
    }

    const failures: string[] = [];
    setDetail(detailResult.value);
    if (clinician) rememberPatient(clinician.id, detailResult.value.header);

    if (timelineResult.status === "fulfilled") {
      setTimeline(timelineResult.value);
    } else {
      setTimeline([]);
      failures.push("최근 타임라인");
    }

    if (measurementResult.status === "fulfilled") {
      setMeasurements(measurementResult.value);
    } else {
      setMeasurements([]);
      failures.push("검사 추이");
    }

    setPartialFailures(failures);
    setLoading(false);
  }, [clinician, patientId]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => void load());
    return () => window.cancelAnimationFrame(frame);
  }, [load]);

  const openEvidence = useCallback((evidenceId: string) => {
    const found = focusEvidence(evidenceId);
    setEvidenceNotice(
      found
        ? ""
        : "이 근거는 현재 불러온 기록 범위에 없습니다. 타임라인의 전체 기간을 조회하면 확인하실 수 있습니다.",
    );
  }, []);

  const prescriptions = useMemo(
    () => flattenPrescriptions(detail?.currentPrescriptions ?? []),
    [detail?.currentPrescriptions],
  );

  if (loading) return <PatientDetailSkeleton />;
  if (error || !detail) {
    return (
      <ErrorState
        message={error || "사용 가능한 환자 기록이 없습니다."}
        onRetry={() => void load()}
        title="환자 상세를 열지 못했습니다"
      />
    );
  }

  const missingCategories = [
    ...(detail.summary.missingRecordCategories ?? []),
    ...partialFailures,
  ];

  return (
    <div className="space-y-6 print:space-y-4">
      <section className="print:pb-2 print:border-b print:border-slate-300">
        <div className="flex items-center justify-between print:hidden">
          <Link
            className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-teal-800"
            href="/patients"
          >
            <ArrowLeft className="size-4" aria-hidden />
            환자 목록
          </Link>
          <button
            className="button-secondary text-xs"
            onClick={() => window.print()}
            type="button"
          >
            <Printer className="size-3.5 text-slate-600" aria-hidden />
            회진용 인쇄
          </button>
        </div>
        <div className="mt-4 flex flex-col justify-between gap-4 lg:flex-row lg:items-end print:mt-0">
          <div className="flex items-center gap-4">
            <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-slate-900 text-xl font-bold text-white shadow-xs print:bg-slate-800">
              {detail.header.name.slice(0, 1)}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                  {detail.header.name}
                </h1>
                <span className="badge border-slate-200 bg-slate-100 text-xs font-semibold text-slate-700">
                  {detail.header.patientNumber}
                </span>
              </div>
              <p className="mt-1 text-sm font-medium text-slate-500">
                {detail.header.age}세 · {formatSex(detail.header.sexCode)} · {detail.header.departmentName || "내과"}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:flex">
            <HeaderFact
              label="최근 진료"
              value={formatDate(detail.header.lastEncounterAt)}
            />
            <HeaderFact
              label="다음 예약"
              value={formatDateTime(detail.nextAppointment?.scheduledStart)}
            />
          </div>
        </div>
      </section>

      {missingCategories.length > 0 && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 print:hidden">
          <AlertCircle className="mt-0.5 size-5 shrink-0" aria-hidden />
          <div>
            <p className="font-black">일부 기록을 표시하지 못했습니다</p>
            <p className="mt-1 text-xs leading-5">
              누락 범주: {Array.from(new Set(missingCategories)).join(", ")}.
              조회된 기록만으로 요약했습니다.
            </p>
          </div>
        </div>
      )}

      {evidenceNotice && (
        <div className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-2xs print:hidden" role="status">
          <ExternalLink className="size-4 text-slate-700" aria-hidden />
          {evidenceNotice}
        </div>
      )}

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(340px,1fr)] print:block">
        <div className="min-w-0 space-y-6 print:space-y-4">
          <SummaryCard detail={detail} onEvidence={openEvidence} />

          <section className="card p-5 sm:p-6 print:p-4 print:shadow-none print:border-slate-300">
            <div className="flex items-center justify-between">
              <SectionHeading
                icon={HeartPulse}
                subtitle="동일한 단위의 수치만 비교하여 표시합니다."
                title="검사 결과 변화"
              />
              <span className="badge border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-700">
                <Sparkles className="size-3 text-slate-500" aria-hidden />
                AI 추세 분석
              </span>
            </div>
            <div className="mt-5">
              <MeasurementTrends
                onEvidence={openEvidence}
                series={measurements}
              />
            </div>
          </section>


          <section className="card p-5 sm:p-6 print:p-4 print:shadow-none print:border-slate-300">
            <SectionHeading
              icon={ClipboardList}
              subtitle="진료·검사·처방 기록을 시간순으로 정리했습니다."
              title="최근 타임라인"
            />
            <div className="mt-5">
              <Timeline items={timeline} />
            </div>
          </section>

          <section className="card p-5 sm:p-6 print:p-4 print:shadow-none print:border-slate-300">
            <SectionHeading
              icon={Pill}
              subtitle="처방 기록이며, 실제 복용 여부를 의미하지 않습니다."
              title="현재 처방"
            />
            <div className="mt-5">
              <Prescriptions items={prescriptions} />
            </div>
          </section>
        </div>

        <div className="print:hidden">
          <AiAssistant patientId={patientId} onEvidence={openEvidence} />
        </div>
      </div>
    </div>
  );

}

function PatientDetailSkeleton() {
  return (
    <div className="space-y-6" aria-label="환자 기록을 불러오는 중">
      <div className="flex animate-pulse items-center gap-4">
        <div className="size-14 rounded-2xl bg-slate-200" />
        <div className="space-y-2">
          <div className="h-7 w-40 rounded bg-slate-200" />
          <div className="h-4 w-56 rounded bg-slate-100" />
        </div>
      </div>
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(340px,1fr)]">
        <div className="space-y-6">
          <section className="card p-6">
            <SectionSkeleton rows={3} />
          </section>
          <section className="card p-6">
            <SectionSkeleton rows={4} />
          </section>
          <section className="card p-6">
            <SectionSkeleton rows={4} />
          </section>
        </div>
        <section className="card p-5">
          <SectionSkeleton rows={6} />
        </section>
      </div>
    </div>
  );
}

function HeaderFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-36 rounded-xl border border-slate-200/80 bg-slate-50/60 px-4 py-3">
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-bold text-slate-900">{value}</p>
    </div>
  );
}

function SectionHeading({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: typeof HeartPulse;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex items-start gap-3.5">
      <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-700 border border-slate-200/60">
        <Icon className="size-4.5" aria-hidden />
      </div>
      <div>
        <h2 className="section-title">{title}</h2>
        <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>
      </div>
    </div>
  );
}

function SummaryCard({
  detail,
  onEvidence,
}: {
  detail: PatientDetail;
  onEvidence: (evidenceId: string) => void;
}) {
  const observations = detail.summary.observations ?? [];

  return (
    <section className="card overflow-hidden">
      <div className="border-b border-slate-200/80 bg-white p-5 sm:p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-sm font-bold text-slate-900">
            <div className="grid size-8 place-items-center rounded-lg bg-teal-50 text-teal-700 border border-teal-200/60">
              <Sparkles className="size-4" aria-hidden />
            </div>
            임상 경과 요약
          </div>
          <span className="badge border-teal-200 bg-teal-50 text-xs font-semibold text-teal-800">
            <Sparkles className="size-3" aria-hidden />
            AI 데이터 분석
          </span>
        </div>
        <div className="mt-4 rounded-xl border border-slate-200/70 bg-slate-50/70 p-4">
          <p className="text-sm font-semibold leading-relaxed text-slate-800">
            {detail.summary.text || "사용 가능한 요약 기록이 없습니다."}
          </p>
        </div>
      </div>
      <div className="p-5 sm:p-6 bg-slate-50/30">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900">주요 관찰 및 임상적 변화</h3>
            <p className="mt-0.5 text-xs text-slate-500">
              AI가 진료·검사·처방 데이터를 분석하여 감지한 주요 변화입니다.
            </p>
          </div>
          <span className="badge border-amber-200 bg-amber-50 text-[11px] font-semibold text-amber-800">
            AI 이상 변화 감지
          </span>
        </div>

        {observations.length === 0 ? (
          <div className="mt-3 flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 text-sm font-medium text-slate-600">
            <CheckCircle2 className="size-4.5 text-slate-400" aria-hidden />
            기록은 있지만 주목할 만한 특이 변화가 감지되지 않았습니다.
          </div>
        ) : (
          <div className="mt-3.5 grid gap-3 lg:grid-cols-2">
            {observations.slice(0, 3).map((observation, index) => (
              <article
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs transition hover:border-slate-300"
                key={observation.type + "-" + index}
              >
                <div className="flex gap-3">
                  <AlertCircle className="mt-0.5 size-4.5 shrink-0 text-slate-600" aria-hidden />
                  <p className="text-sm font-semibold leading-6 text-slate-800">
                    {observation.text}
                  </p>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5 pt-2 border-t border-slate-100">
                  {observation.evidenceIds.map((evidenceId) => {
                    const evidence = detail.summary.evidence.find(
                      (item) => item.id === evidenceId,
                    );
                    return (
                      <button
                        className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-700 transition hover:bg-slate-100 hover:border-slate-300"
                        key={evidenceId}
                        onClick={() => onEvidence(evidenceId)}
                        type="button"
                      >
                        <ExternalLink className="size-3 text-slate-400" aria-hidden />
                        {evidence?.label ?? "근거 기록"}
                      </button>
                    );
                  })}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function Timeline({ items }: { items: TimelineItem[] }) {
  if (items.length === 0) {
    return (
      <EmptyState
        message="표시할 진료·검사·처방 기록이 없습니다."
        title="사용 가능한 기록 없음"
      />
    );
  }

  return (
    <ol className="relative space-y-2 before:absolute before:bottom-5 before:left-[17px] before:top-5 before:w-px before:bg-slate-200">
      {items.map((item) => {
        const Icon =
          item.type === "EXAMINATION"
            ? FlaskConical
            : item.type === "PRESCRIPTION"
              ? Pill
              : FileText;
        return (
          <li
            className="relative flex gap-4 rounded-xl border border-transparent p-2.5 transition hover:bg-slate-50/80"
            data-evidence-target="true"
            id={evidenceTargetId(item.evidenceId)}
            key={item.evidenceId}
          >
            <div className="z-10 grid size-9 shrink-0 place-items-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-xs">
              <Icon className="size-4" aria-hidden />
            </div>
            <div className="min-w-0 flex-1 pt-0.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-bold text-slate-900">{item.title}</p>
                <time className="text-xs font-medium text-slate-400">
                  {formatDateTime(item.occurredAt)}
                </time>
              </div>
              <p className="mt-0.5 text-sm leading-6 text-slate-600">
                {item.description || "세부 기록 없음"}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

type PrescriptionView = PrescriptionItem & { evidenceId: string };

function flattenPrescriptions(
  entries: PatientDetail["currentPrescriptions"],
): PrescriptionView[] {
  return entries.flatMap((entry) =>
    entry.items.map((item) => ({
      ...item,
      evidenceId: "prescription:" + entry.id,
    })),
  );
}

function Prescriptions({ items }: { items: PrescriptionView[] }) {
  if (items.length === 0) {
    return (
      <EmptyState
        message="현재 활성 상태인 처방 기록이 없습니다."
        title="사용 가능한 처방 기록 없음"
      />
    );
  }

  return (
    <div className="divide-y divide-slate-100">
      {items.map((item, index) => (
        <div
          className="flex items-start gap-4 py-3.5 first:pt-0 last:pb-0"
          data-evidence-ids={item.evidenceId}
          key={item.id || index}
        >
          <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-700 border border-slate-200/60">
            <Pill className="size-4.5" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold text-slate-900">{item.medicationName}</p>
              <span className="badge border-slate-200 bg-slate-50 text-[11px] font-medium text-slate-600">
                유지 처방
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-600">
              {item.doseValue != null
                ? String(item.doseValue) + (item.doseUnit ?? "")
                : "용량 기록 없음"}
              {item.frequencyPerDay != null
                ? " · 하루 " + item.frequencyPerDay + "회"
                : ""}
              {item.route ? " · " + item.route : ""}
            </p>
            {item.instructions && (
              <p className="mt-1 text-xs leading-5 text-slate-500">
                {item.instructions}
              </p>
            )}
          </div>
          <div className="hidden text-right text-xs text-slate-400 sm:block">
            <p>{formatDate(item.startDate)}</p>
            {item.endDate && <p className="mt-1">~ {formatDate(item.endDate)}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

