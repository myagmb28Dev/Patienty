"use client";

import {
  ArrowRight,
  CalendarClock,
  Clock3,
  Search,
  Stethoscope,
  TriangleAlert,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AttentionBadge, EmptyState, ErrorState, SectionSkeleton } from "@/components/ui/states";
import { useAuth } from "@/features/auth/auth-provider";
import { dashboardApi } from "@/lib/api/client";
import type { DashboardResponse } from "@/lib/api/types";
import { formatAppointmentStatus, formatDateTime, formatSex } from "@/lib/format";
import { readRecentPatients, type RecentPatient } from "@/lib/recent-patients";

export function DashboardPage() {
  const { clinician } = useAuth();
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [recent, setRecent] = useState<RecentPatient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await dashboardApi.get());
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "대시보드를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setRecent(clinician ? readRecentPatients(clinician.id) : []);
      void load();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [clinician, load]);

  const appointments = data?.todayAppointments ?? [];
  const attentionPatients = data?.patientsNeedingReview ?? [];

  return (
    <div className="space-y-7">
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-bold text-teal-700">오늘의 진료 흐름</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-950">
            {clinician?.name ?? "의료진"}님, 환자 현황을 확인하세요
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            담당 환자의 예약과 최근 변화를 빠르게 확인할 수 있습니다.
          </p>
        </div>
        <Link className="button-primary" href="/patients">
          <Search className="size-4" aria-hidden />
          환자 찾기
        </Link>
      </section>

      {error ? (
        <ErrorState message={error} onRetry={() => void load()} />
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              icon={CalendarClock}
              label="오늘 예약"
              loading={loading}
              tone="teal"
              value={appointments.length}
            />
            <MetricCard
              icon={TriangleAlert}
              label="변화 검토 필요"
              loading={loading}
              tone="amber"
              value={attentionPatients.length}
            />
            <MetricCard
              icon={Users}
              label="최근 확인"
              loading={false}
              tone="blue"
              value={recent.length}
            />
            <MetricCard
              icon={Stethoscope}
              label="담당 의료진"
              loading={false}
              tone="slate"
              value={clinician ? 1 : 0}
            />
          </section>

          <div className="grid gap-6 xl:grid-cols-[1.15fr_.85fr]">
            <section className="card p-5 sm:p-6">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="section-title">오늘 예약</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    시간순으로 정리한 담당 환자의 진료 예약입니다.
                  </p>
                </div>
                <Clock3 className="size-5 text-slate-400" aria-hidden />
              </div>
              {loading ? (
                <SectionSkeleton rows={4} />
              ) : appointments.length === 0 ? (
                <EmptyState
                  message="오늘 예정된 담당 환자 예약이 없습니다."
                  title="예약 기록 없음"
                />
              ) : (
                <div className="divide-y divide-slate-100">
                  {appointments.map((appointment) => (
                    <Link
                      className="group flex items-center gap-4 py-4 first:pt-0 last:pb-0"
                      href={`/patients/${appointment.patientId}`}
                      key={appointment.appointmentId}
                    >
                      <div className="min-w-20 rounded-xl bg-slate-100 px-3 py-2 text-center text-sm font-black text-slate-700">
                        {formatDateTime(appointment.scheduledStart).split(" ").slice(-2).join(" ")}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-bold text-slate-900">
                          {appointment.patientName ?? "환자 이름 미기재"}
                        </p>
                        <p className="mt-1 truncate text-xs text-slate-500">
                          {appointment.patientNumber ?? "환자번호 없음"} · {appointment.departmentName}
                        </p>
                      </div>
                      <span className="badge border-slate-200 bg-slate-50 text-slate-600">
                        {formatAppointmentStatus(appointment.status)}
                      </span>
                      <ArrowRight className="size-4 text-slate-300 transition group-hover:translate-x-1 group-hover:text-teal-600" />
                    </Link>
                  ))}
                </div>
              )}
            </section>

            <section className="card p-5 sm:p-6">
              <div className="mb-5">
                <h2 className="section-title">변화 검토 필요</h2>
                <p className="mt-1 text-sm text-slate-500">
                  진단이 아닌, 기록상 변화가 감지된 담당 환자입니다.
                </p>
              </div>
              {loading ? (
                <SectionSkeleton rows={4} />
              ) : attentionPatients.length === 0 ? (
                <EmptyState
                  message="현재 검토가 필요한 변화가 감지되지 않았습니다."
                  title="특이 변화 없음"
                />
              ) : (
                <div className="space-y-3">
                  {attentionPatients.map((patient) => (
                    <Link
                      className="group flex items-center gap-3 rounded-xl border border-slate-200 p-3 transition hover:border-teal-300 hover:bg-teal-50/40"
                      href={`/patients/${patient.id}`}
                      key={patient.id}
                    >
                      <div className="grid size-10 shrink-0 place-items-center rounded-full bg-slate-100 text-sm font-black text-slate-700">
                        {patient.name.slice(0, 1)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-slate-900">
                          {patient.name}
                        </p>
                        <p className="truncate text-xs text-slate-500">
                          {patient.age}세 · {formatSex(patient.sexCode)} · {patient.departmentName ?? "진료과 없음"}
                        </p>
                      </div>
                      <AttentionBadge count={patient.attentionCount} />
                    </Link>
                  ))}
                </div>
              )}
            </section>
          </div>

          <section className="card p-5 sm:p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="section-title">최근 확인한 환자</h2>
                <p className="mt-1 text-sm text-slate-500">
                  최근 조회한 환자 바로가기 목록입니다.
                </p>
              </div>
              <Link className="text-sm font-bold text-teal-700 hover:text-teal-900" href="/patients">
                전체 환자 보기
              </Link>
            </div>
            {recent.length === 0 ? (
              <EmptyState
                message="환자 상세를 조회하면 여기에 바로가기 기록이 표시됩니다."
                title="최근 확인 기록 없음"
              />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {recent.map((patient) => (
                  <Link
                    className="rounded-xl border border-slate-200 p-4 transition hover:border-teal-300 hover:bg-teal-50/40"
                    href={`/patients/${patient.id}`}
                    key={patient.id}
                  >
                    <p className="font-bold text-slate-900">{patient.name}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {patient.patientNumber} · {patient.age}세 · {formatSex(patient.sexCode)}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  loading,
  tone,
}: {
  icon: typeof CalendarClock;
  label: string;
  value: number;
  loading: boolean;
  tone: "teal" | "amber" | "blue" | "slate";
}) {
  const tones = {
    teal: "bg-teal-50 text-teal-700",
    amber: "bg-amber-50 text-amber-700",
    blue: "bg-sky-50 text-sky-700",
    slate: "bg-slate-100 text-slate-700",
  };

  return (
    <div className="card flex items-center gap-4 p-5">
      <div className={`grid size-12 place-items-center rounded-2xl ${tones[tone]}`}>
        <Icon className="size-6" aria-hidden />
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-500">{label}</p>
        {loading ? (
          <div className="mt-2 h-7 w-12 animate-pulse rounded bg-slate-100" />
        ) : (
          <p className="mt-1 text-2xl font-black text-slate-950">{value}</p>
        )}
      </div>
    </div>
  );
}
