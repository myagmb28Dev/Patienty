import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { PatientHeader } from "@/lib/api/types";
import {
  clearRecentPatients,
  readRecentPatients,
  rememberPatient,
} from "@/lib/recent-patients";

const patient: PatientHeader = {
  id: "10000000-0000-0000-0000-000000000001",
  patientNumber: "PAT-000001",
  name: "김민준",
  birthDate: "1972-04-12",
  age: 54,
  sexCode: "MALE",
  departmentCode: "INTERNAL_MEDICINE",
  departmentName: "내과",
  lastEncounterAt: "2026-08-20T00:00:00Z",
  synthetic: true,
};

describe("recent patients", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("scopes patient identifiers to the signed-in clinician", () => {
    rememberPatient("clinician-kim", patient);

    expect(readRecentPatients("clinician-kim")).toHaveLength(1);
    expect(readRecentPatients("clinician-lee")).toEqual([]);
    expect(localStorage.length).toBe(0);
  });

  it("clears the clinician session history on logout", () => {
    rememberPatient("clinician-kim", patient);
    clearRecentPatients("clinician-kim");

    expect(readRecentPatients("clinician-kim")).toEqual([]);
  });

  it("keeps navigation and logout working when Web Storage is blocked", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("blocked");
    });
    expect(() => rememberPatient("clinician-kim", patient)).not.toThrow();

    vi.restoreAllMocks();
    vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {
      throw new DOMException("blocked");
    });
    expect(() => clearRecentPatients("clinician-kim")).not.toThrow();
  });
});
