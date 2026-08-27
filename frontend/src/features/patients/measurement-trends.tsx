"use client";

import { AlertCircle, ArrowDown, ArrowRight, ArrowUp, ChartNoAxesCombined } from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { MeasurementSeries } from "@/lib/api/types";
import { formatDate, formatTrend } from "@/lib/format";
import { evidenceTargetId } from "@/features/patients/evidence";
import { EmptyState } from "@/components/ui/states";

export function MeasurementTrends({
  series,
  onEvidence,
}: {
  series: MeasurementSeries[];
  onEvidence: (evidenceId: string) => void;
}) {
  if (series.length === 0) {
    return (
      <EmptyState
        message="비교할 수 있는 수치 검사 기록이 없어."
        title="검사 결과 기록 없음"
      />
    );
  }

  return (
    <div className="grid gap-4 2xl:grid-cols-2">
      {series.map((measurement) => (
        <MeasurementCard
          key={measurement.metricCode}
          measurement={measurement}
          onEvidence={onEvidence}
        />
      ))}
    </div>
  );
}

function MeasurementCard({
  measurement,
  onEvidence,
}: {
  measurement: MeasurementSeries;
  onEvidence: (evidenceId: string) => void;
}) {
  const chartData = measurement.points.map((point) => ({
    ...point,
    dateLabel: new Intl.DateTimeFormat("ko-KR", {
      month: "numeric",
      day: "numeric",
    }).format(new Date(point.occurredAt)),
  }));
  const TrendIcon =
    measurement.trendDirection === "UP"
      ? ArrowUp
      : measurement.trendDirection === "DOWN"
        ? ArrowDown
        : ArrowRight;
  const latest = measurement.points.at(-1);
  const needsReview = Boolean(
    latest?.abnormalFlag && latest.abnormalFlag !== "NORMAL",
  );
  const trendClass = needsReview
    ? "border-amber-200 bg-amber-50 text-amber-800"
    : "border-slate-200 bg-white text-slate-600";
  const chartLabel =
    measurement.displayName +
    " 변화 차트. " +
    chartData
      .map(
        (point) =>
          point.dateLabel +
          " " +
          point.value +
          (measurement.unit || ""),
      )
      .join(", ");

  return (
    <article
      className="rounded-2xl border border-slate-200 bg-slate-50/45 p-4"
      data-evidence-ids={measurement.points.map((point) => point.evidenceId).join(" ")}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-black text-slate-900">{measurement.displayName}</p>
          <p className="mt-1 text-xs text-slate-500">
            최근 {measurement.points.length}회 측정 · {measurement.unit || "단위 없음"}
          </p>
        </div>
        <span className={"badge " + trendClass}>
          {needsReview ? (
            <AlertCircle className="size-3.5" aria-hidden />
          ) : (
            <TrendIcon className="size-3.5" aria-hidden />
          )}
          {needsReview
            ? "참고범위 밖"
            : formatTrend(
                measurement.trendDirection,
                measurement.delta,
              )}
        </span>
      </div>

      {chartData.length >= 2 ? (
        <div aria-label={chartLabel} className="mt-5 h-48 w-full" role="img">
          <ResponsiveContainer height="100%" width="100%">
            <LineChart data={chartData} margin={{ left: -20, right: 12, top: 8, bottom: 0 }}>
              <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
              <XAxis axisLine={false} dataKey="dateLabel" fontSize={11} tickLine={false} />
              <YAxis
                axisLine={false}
                domain={["dataMin - 5", "dataMax + 5"]}
                fontSize={11}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  border: "1px solid #cbd5e1",
                  borderRadius: 12,
                  boxShadow: "0 8px 24px rgba(15, 23, 42, .08)",
                  fontSize: 12,
                }}
                formatter={(value) => [
                  String(value) + " " + measurement.unit,
                  measurement.displayName,
                ]}
              />
              <Line
                activeDot={{ r: 5 }}
                dataKey="value"
                dot={{ fill: "#0f766e", r: 3, strokeWidth: 0 }}
                stroke="#0f766e"
                strokeWidth={2.5}
                type="monotone"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="mt-5 flex h-32 items-center justify-center rounded-xl border border-dashed border-slate-300 text-sm text-slate-500">
          <ChartNoAxesCombined className="mr-2 size-5" aria-hidden />
          추세를 계산하려면 측정값이 더 필요해.
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        {measurement.points.slice(-4).map((point) => {
          const abnormal = Boolean(
            point.abnormalFlag && point.abnormalFlag !== "NORMAL",
          );
          const pointClass = abnormal
            ? "border-amber-200 bg-amber-50 text-amber-900"
            : "border-slate-200 bg-white text-slate-700";
          return (
            <button
              className={
                "rounded-lg border px-2.5 py-2 text-left text-xs transition hover:border-teal-400 " +
                pointClass
              }
              data-evidence-target="true"
              id={evidenceTargetId(point.evidenceId)}
              key={point.evidenceId}
              onClick={() => onEvidence(point.evidenceId)}
              type="button"
            >
              <span className="block text-[11px] text-slate-500">
                {formatDate(point.occurredAt)}
              </span>
              <span className="mt-0.5 block font-black">
                {point.value} {measurement.unit}
                {abnormal && <span className="ml-1 font-bold">· 범위 밖</span>}
              </span>
            </button>
          );
        })}
      </div>
    </article>
  );
}
