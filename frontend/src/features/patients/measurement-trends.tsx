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
        message="비교할 수 있는 수치 검사 기록이 없습니다."
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
      className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs transition hover:border-slate-300"
      data-evidence-ids={measurement.points.map((point) => point.evidenceId).join(" ")}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-slate-900">{measurement.displayName}</p>
          <p className="mt-0.5 text-xs text-slate-500">
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
        <div aria-label={chartLabel} className="chart-container mt-4 h-44 w-full" role="img">
          <ResponsiveContainer height="100%" width="100%">
            <LineChart data={chartData} margin={{ left: -20, right: 12, top: 8, bottom: 0 }}>
              <CartesianGrid stroke="#f1f5f9" strokeDasharray="3 3" vertical={false} />
              <XAxis axisLine={false} dataKey="dateLabel" fontSize={11} stroke="#64748b" tickLine={false} />
              <YAxis
                axisLine={false}
                domain={["dataMin - 5", "dataMax + 5"]}
                fontSize={11}
                stroke="#64748b"
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: 10,
                  boxShadow: "0 4px 12px rgba(15, 23, 42, .06)",
                  fontSize: 12,
                }}
                formatter={(value) => [
                  String(value) + " " + measurement.unit,
                  measurement.displayName,
                ]}
              />
              <Line
                activeDot={{ r: 4.5 }}
                animationBegin={100}
                animationDuration={1000}
                animationEasing="ease-out"
                dataKey="value"
                dot={{ fill: "#334155", r: 3, strokeWidth: 0 }}
                isAnimationActive={true}
                stroke="#334155"
                strokeWidth={2}
                type="monotone"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="mt-4 flex h-32 items-center justify-center rounded-xl border border-dashed border-slate-200 text-xs text-slate-400">
          <ChartNoAxesCombined className="mr-2 size-4" aria-hidden />
          추세를 계산하려면 측정값이 더 필요합니다.
        </div>
      )}

      <div className="mt-3.5 flex flex-wrap gap-2 pt-3 border-t border-slate-100">
        {measurement.points.slice(-4).map((point) => {
          const abnormal = Boolean(
            point.abnormalFlag && point.abnormalFlag !== "NORMAL",
          );
          const pointClass = abnormal
            ? "border-amber-200 bg-amber-50/80 text-amber-900"
            : "border-slate-200 bg-slate-50/70 text-slate-700 hover:bg-slate-100";
          return (
            <button
              className={
                "rounded-lg border px-2.5 py-1.5 text-left text-xs transition " +
                pointClass
              }
              data-evidence-target="true"
              id={evidenceTargetId(point.evidenceId)}
              key={point.evidenceId}
              onClick={() => onEvidence(point.evidenceId)}
              type="button"
            >
              <span className="block text-[10px] text-slate-400">
                {formatDate(point.occurredAt)}
              </span>
              <span className="mt-0.5 block font-semibold text-xs">
                {point.value} {measurement.unit}
                {abnormal && <span className="ml-1 text-[10px] font-bold text-amber-700">· 범위 밖</span>}
              </span>
            </button>
          );
        })}
      </div>
    </article>
  );
}
