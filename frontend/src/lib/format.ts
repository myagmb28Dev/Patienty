const dateFormatter = new Intl.DateTimeFormat("ko-KR", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const dateTimeFormatter = new Intl.DateTimeFormat("ko-KR", {
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatDate(value?: string | null) {
  if (!value) return "기록 없음";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "기록 없음" : dateFormatter.format(date);
}

export function formatDateTime(value?: string | null) {
  if (!value) return "기록 없음";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "기록 없음"
    : dateTimeFormatter.format(date);
}

export function formatSex(code: string) {
  const normalized = code.toUpperCase();
  if (normalized === "M" || normalized === "MALE") return "남성";
  if (normalized === "F" || normalized === "FEMALE") return "여성";
  return "미기재";
}

export function formatAppointmentStatus(status: string) {
  const labels: Record<string, string> = {
    SCHEDULED: "예약",
    CHECKED_IN: "접수",
    IN_PROGRESS: "진료 중",
    COMPLETED: "완료",
    MISSED: "미방문",
    CANCELLED: "취소",
  };
  return labels[status] ?? status;
}

export function formatRole(role: string) {
  const labels: Record<string, string> = {
    CLINICIAN: "의료진",
    DOCTOR: "의사",
    NURSE: "간호사",
    ADMIN: "관리자",
  };
  return labels[role] ?? role;
}

export function formatTrend(direction: string, delta?: number | null) {
  if (direction === "UP") return `상승${delta == null ? "" : ` +${delta}`}`;
  if (direction === "DOWN") return `하락${delta == null ? "" : ` ${delta}`}`;
  if (direction === "STABLE") return "유지";
  return "비교 자료 부족";
}

export function formatPrescriptionStatus(status?: string | null) {
  if (!status) return "처방 기록";
  const labels: Record<string, string> = {
    ACTIVE: "유지 처방",
    SUPERSEDED: "처방 변경",
    SUSPENDED: "처방 중단",
    SUSPEND: "처방 중단",
    STOPPED: "처방 중단",
    CANCELLED: "처방 취소",
    CANCELED: "처방 취소",
    COMPLETED: "처방 완료",
  };
  return labels[status.toUpperCase()] ?? status;
}

