import { describe, expect, it } from "vitest";
import {
  formatAppointmentStatus,
  formatDate,
  formatPrescriptionStatus,
  formatSex,
  formatTrend,
} from "@/lib/format";

describe("Korean record formatting", () => {
  it("uses explicit missing-record language", () => {
    expect(formatDate(null)).toBe("기록 없음");
  });

  it("maps stable API codes without changing unknown values", () => {
    expect(formatSex("MALE")).toBe("남성");
    expect(formatAppointmentStatus("SCHEDULED")).toBe("예약");
    expect(formatAppointmentStatus("CUSTOM")).toBe("CUSTOM");
  });

  it("keeps deterministic trend wording", () => {
    expect(formatTrend("UP", 14)).toBe("상승 +14");
    expect(formatTrend("INSUFFICIENT_DATA")).toBe("비교 자료 부족");
  });

  it("maps prescription status to natural Korean wording", () => {
    expect(formatPrescriptionStatus("ACTIVE")).toBe("유지 처방");
    expect(formatPrescriptionStatus("SUPERSEDED")).toBe("처방 변경");
    expect(formatPrescriptionStatus("SUSPENDED")).toBe("처방 중단");
    expect(formatPrescriptionStatus(null)).toBe("처방 기록");
  });
});

