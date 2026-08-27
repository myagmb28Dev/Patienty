import type { PatientHeader } from "@/lib/api/types";

export interface RecentPatient {
  id: string;
  patientNumber: string;
  name: string;
  age: number;
  sexCode: string;
  viewedAt: string;
}

const STORAGE_KEY_PREFIX = "patienty:recent-patients:";
const LEGACY_STORAGE_KEY = "patienty:recent-patients";
const MAX_ITEMS = 5;

function storageKey(clinicianId: string) {
  return `${STORAGE_KEY_PREFIX}${clinicianId}`;
}

function removeLegacyStorage() {
  try {
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch {
    // Recent history is optional and must never break clinical navigation.
  }
}

export function readRecentPatients(clinicianId: string): RecentPatient[] {
  if (typeof window === "undefined") return [];

  try {
    removeLegacyStorage();
    const value = JSON.parse(
      sessionStorage.getItem(storageKey(clinicianId)) || "[]",
    );
    return Array.isArray(value) ? value.slice(0, MAX_ITEMS) : [];
  } catch {
    return [];
  }
}

export function rememberPatient(clinicianId: string, header: PatientHeader) {
  if (typeof window === "undefined") return;

  const next: RecentPatient = {
    id: header.id,
    patientNumber: header.patientNumber,
    name: header.name,
    age: header.age,
    sexCode: header.sexCode,
    viewedAt: new Date().toISOString(),
  };
  try {
    const rest = readRecentPatients(clinicianId).filter(
      (patient) => patient.id !== header.id,
    );
    sessionStorage.setItem(
      storageKey(clinicianId),
      JSON.stringify([next, ...rest].slice(0, MAX_ITEMS)),
    );
  } catch {
    // Browsers can disable Web Storage; patient pages must still finish loading.
  }
}

export function clearRecentPatients(clinicianId: string) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(storageKey(clinicianId));
  } catch {
    // Server logout and in-memory auth cleanup take priority over recent history.
  }
  removeLegacyStorage();
}
