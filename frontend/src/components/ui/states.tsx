import {
  AlertCircle,
  FileQuestion,
  LoaderCircle,
  RotateCcw,
  SearchX,
} from "lucide-react";

export function PageLoader({ label = "기록을 불러오는 중" }: { label?: string }) {
  return (
    <div className="flex min-h-[55vh] items-center justify-center" role="status">
      <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-semibold text-slate-600 shadow-sm">
        <LoaderCircle className="size-5 animate-spin text-teal-600" aria-hidden />
        {label}
      </div>
    </div>
  );
}

export function SectionSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="animate-pulse space-y-3" aria-label="불러오는 중">
      {Array.from({ length: rows }).map((_, index) => (
        <div
          className="h-16 rounded-xl bg-slate-100"
          key={index}
          style={{ opacity: 1 - index * 0.13 }}
        />
      ))}
    </div>
  );
}

export function ErrorState({
  title = "데이터를 불러오지 못했어",
  message = "잠시 후 다시 시도해줘.",
  onRetry,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div
      className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center"
      role="alert"
    >
      <AlertCircle className="mx-auto size-7 text-rose-500" aria-hidden />
      <h3 className="mt-3 font-bold text-slate-900">{title}</h3>
      <p className="mt-1 text-sm text-slate-600">{message}</p>
      {onRetry && (
        <button className="button-secondary mt-4" onClick={onRetry} type="button">
          <RotateCcw className="size-4" aria-hidden />
          다시 시도
        </button>
      )}
    </div>
  );
}

export function EmptyState({
  title,
  message,
  actionLabel,
  onAction,
  search = false,
}: {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  search?: boolean;
}) {
  const Icon = search ? SearchX : FileQuestion;
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-8 text-center">
      <Icon className="mx-auto size-8 text-slate-400" aria-hidden />
      <h3 className="mt-3 font-bold text-slate-800">{title}</h3>
      <p className="mt-1 text-sm text-slate-500">{message}</p>
      {actionLabel && onAction && (
        <button className="button-secondary mt-4" onClick={onAction} type="button">
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export function AttentionBadge({ count }: { count: number }) {
  if (count <= 0) {
    return (
      <span className="badge border-emerald-200 bg-emerald-50 text-emerald-700">
        특이 변화 없음
      </span>
    );
  }

  return (
    <span className="badge border-amber-200 bg-amber-50 text-amber-800">
      <AlertCircle className="size-3.5" aria-hidden />
      검토 {count}
    </span>
  );
}
