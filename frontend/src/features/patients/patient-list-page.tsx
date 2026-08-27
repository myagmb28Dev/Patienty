"use client";

import {
  ArrowLeft,
  ArrowRight,
  FilterX,
  Search,
  SlidersHorizontal,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AttentionBadge, EmptyState, ErrorState, SectionSkeleton } from "@/components/ui/states";
import { patientsApi } from "@/lib/api/client";
import type { PageResponse, PatientListItem } from "@/lib/api/types";
import { formatDate, formatSex } from "@/lib/format";

const departments = [
  { value: "", label: "전체 진료과" },
  { value: "INTERNAL_MEDICINE", label: "내과" },
  { value: "CARDIOLOGY", label: "심장내과" },
  { value: "ORTHOPEDICS", label: "정형외과" },
  { value: "ENDOCRINOLOGY", label: "내분비내과" },
];

const statuses = [
  { value: "", label: "전체 예약 상태" },
  { value: "SCHEDULED", label: "예약 예정" },
  { value: "CHECKED_IN", label: "접수" },
  { value: "COMPLETED", label: "진료 완료" },
  { value: "MISSED", label: "미방문" },
  { value: "CANCELLED", label: "취소" },
];

export function PatientListPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryString = searchParams.toString();
  const query = searchParams.get("q") ?? "";
  const department = searchParams.get("department") ?? "";
  const appointmentStatus = searchParams.get("appointmentStatus") ?? "";
  const page = Math.max(0, Number(searchParams.get("page") ?? 0) || 0);
  const [searchDraft, setSearchDraft] = useState(query);
  const [result, setResult] = useState<PageResponse<PatientListItem> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setSearchDraft(query));
    return () => window.cancelAnimationFrame(frame);
  }, [query]);

  const setQuery = useCallback(
    (changes: Record<string, string | number | null>) => {
      const next = new URLSearchParams(queryString);
      Object.entries(changes).forEach(([key, value]) => {
        if (value === null || value === "") next.delete(key);
        else next.set(key, String(value));
      });
      const value = next.toString();
      router.replace(value ? `${pathname}?${value}` : pathname, { scroll: false });
    },
    [pathname, queryString, router],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (searchDraft.trim() !== query) {
        setQuery({ q: searchDraft.trim(), page: null });
      }
    }, 350);
    return () => window.clearTimeout(timer);
  }, [query, searchDraft, setQuery]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setResult(
        await patientsApi.list({
          q: query,
          department,
          appointmentStatus,
          page,
          size: 10,
        }),
      );
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "환자 목록을 불러오지 못했어.");
    } finally {
      setLoading(false);
    }
  }, [appointmentStatus, department, page, query]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => void load());
    return () => window.cancelAnimationFrame(frame);
  }, [load]);

  const hasFilters = Boolean(query || department || appointmentStatus);
  const totalLabel = useMemo(
    () => (loading ? "조회 중" : `담당 환자 ${result?.totalElements ?? 0}명`),
    [loading, result?.totalElements],
  );

  const clearFilters = () => {
    setSearchDraft("");
    router.replace(pathname, { scroll: false });
  };

  return (
    <div className="space-y-6">
      <section>
        <p className="text-sm font-bold text-teal-700">담당 환자</p>
        <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-950">
          환자 찾기
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          이름이나 환자번호로 찾고, 최근 기록과 변화 표시를 바로 확인해.
        </p>
      </section>

      <section className="card p-4 sm:p-5">
        <div className="grid gap-3 lg:grid-cols-[minmax(260px,1fr)_210px_210px_auto]">
          <label className="relative">
            <span className="sr-only">환자 이름 또는 환자번호</span>
            <Search className="pointer-events-none absolute left-3 top-3.5 size-4 text-slate-400" aria-hidden />
            <input
              className="field pl-10"
              onChange={(event) => setSearchDraft(event.target.value)}
              placeholder="이름 또는 PAT-000124"
              type="search"
              value={searchDraft}
            />
          </label>
          <label>
            <span className="sr-only">진료과</span>
            <select
              className="field"
              onChange={(event) =>
                setQuery({ department: event.target.value, page: null })
              }
              value={department}
            >
              {departments.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="sr-only">예약 상태</span>
            <select
              className="field"
              onChange={(event) =>
                setQuery({ appointmentStatus: event.target.value, page: null })
              }
              value={appointmentStatus}
            >
              {statuses.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <button
            className="button-secondary"
            disabled={!hasFilters}
            onClick={clearFilters}
            type="button"
          >
            <FilterX className="size-4" aria-hidden />
            초기화
          </button>
        </div>
        <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-4 text-xs font-semibold text-slate-500">
          <SlidersHorizontal className="size-4" aria-hidden />
          {totalLabel} · 최근 진료일 순
        </div>
      </section>

      <section className="card overflow-hidden">
        {error ? (
          <div className="p-6">
            <ErrorState message={error} onRetry={() => void load()} />
          </div>
        ) : loading ? (
          <div className="p-5">
            <SectionSkeleton rows={7} />
          </div>
        ) : !result || result.content.length === 0 ? (
          <div className="p-6">
            <EmptyState
              actionLabel={hasFilters ? "필터 초기화" : undefined}
              message={
                hasFilters
                  ? "검색어나 필터를 조금 바꿔봐."
                  : "현재 배정된 환자 기록이 없어."
              }
              onAction={hasFilters ? clearFilters : undefined}
              search
              title={hasFilters ? "검색 결과가 없어" : "환자 기록 없음"}
            />
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full border-collapse text-left">
                <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3">환자</th>
                    <th className="px-5 py-3">진료과</th>
                    <th className="px-5 py-3">최근 진료</th>
                    <th className="px-5 py-3">다음 예약</th>
                    <th className="px-5 py-3">변화</th>
                    <th className="w-12 px-5 py-3"><span className="sr-only">열기</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {result.content.map((patient) => (
                    <PatientRow key={patient.id} patient={patient} />
                  ))}
                </tbody>
              </table>
            </div>
            <div className="divide-y divide-slate-100 md:hidden">
              {result.content.map((patient) => (
                <PatientCard key={patient.id} patient={patient} />
              ))}
            </div>
            <Pagination
              onPage={(nextPage) => setQuery({ page: nextPage })}
              page={result.page}
              totalPages={result.totalPages}
            />
          </>
        )}
      </section>
    </div>
  );
}

function PatientRow({ patient }: { patient: PatientListItem }) {
  return (
    <tr className="group transition hover:bg-teal-50/35">
      <td className="px-5 py-4">
        <Link className="flex items-center gap-3" href={`/patients/${patient.id}`}>
          <div className="grid size-10 shrink-0 place-items-center rounded-full bg-slate-100 text-sm font-black text-slate-700 group-hover:bg-teal-100 group-hover:text-teal-800">
            {patient.name.slice(0, 1)}
          </div>
          <div>
            <p className="font-bold text-slate-950">{patient.name}</p>
            <p className="mt-0.5 text-xs text-slate-500">
              {patient.patientNumber} · {patient.age}세 · {formatSex(patient.sexCode)}
            </p>
          </div>
        </Link>
      </td>
      <td className="px-5 py-4 text-sm text-slate-700">
        {patient.departmentName ?? "기록 없음"}
      </td>
      <td className="px-5 py-4 text-sm text-slate-600">
        {formatDate(patient.lastEncounterAt)}
      </td>
      <td className="px-5 py-4 text-sm text-slate-600">
        {formatDate(patient.nextAppointmentAt)}
      </td>
      <td className="px-5 py-4"><AttentionBadge count={patient.attentionCount} /></td>
      <td className="px-5 py-4">
        <Link
          aria-label={`${patient.name} 상세 열기`}
          className="grid size-9 place-items-center rounded-lg text-slate-400 hover:bg-teal-100 hover:text-teal-800"
          href={`/patients/${patient.id}`}
        >
          <ArrowRight className="size-4" />
        </Link>
      </td>
    </tr>
  );
}

function PatientCard({ patient }: { patient: PatientListItem }) {
  return (
    <Link className="block p-4 hover:bg-teal-50/35" href={`/patients/${patient.id}`}>
      <div className="flex items-start gap-3">
        <div className="grid size-10 place-items-center rounded-full bg-slate-100">
          <UserRound className="size-5 text-slate-600" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-slate-950">{patient.name}</p>
          <p className="mt-0.5 text-xs text-slate-500">
            {patient.patientNumber} · {patient.age}세 · {formatSex(patient.sexCode)}
          </p>
        </div>
        <AttentionBadge count={patient.attentionCount} />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
        <div>
          <p className="text-slate-400">최근 진료</p>
          <p className="mt-1 font-semibold text-slate-700">{formatDate(patient.lastEncounterAt)}</p>
        </div>
        <div>
          <p className="text-slate-400">다음 예약</p>
          <p className="mt-1 font-semibold text-slate-700">{formatDate(patient.nextAppointmentAt)}</p>
        </div>
      </div>
    </Link>
  );
}

function Pagination({
  page,
  totalPages,
  onPage,
}: {
  page: number;
  totalPages: number;
  onPage: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between border-t border-slate-200 px-4 py-4 sm:px-5">
      <button
        className="button-secondary"
        disabled={page <= 0}
        onClick={() => onPage(page - 1)}
        type="button"
      >
        <ArrowLeft className="size-4" aria-hidden />
        이전
      </button>
      <p className="text-sm font-semibold text-slate-600">
        <span className="text-slate-950">{page + 1}</span> / {totalPages} 페이지
      </p>
      <button
        className="button-secondary"
        disabled={page + 1 >= totalPages}
        onClick={() => onPage(page + 1)}
        type="button"
      >
        다음
        <ArrowRight className="size-4" aria-hidden />
      </button>
    </div>
  );
}
