export type AiStatus =
  | "ANSWERED"
  | "INSUFFICIENT_EVIDENCE"
  | "UNSUPPORTED_REQUEST";

export type AttentionLevel = "INFO" | "ATTENTION" | "NEEDS_REVIEW";
export type TrendDirection = "UP" | "DOWN" | "STABLE" | "INSUFFICIENT_DATA";

export interface Clinician {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface CsrfResponse {
  token: string;
  headerName: string;
}

export interface Evidence {
  id: string;
  sourceType: string;
  occurredAt: string;
  label: string;
}

export interface Observation {
  type: string;
  level: AttentionLevel | string;
  text: string;
  evidenceIds: string[];
}

export interface AiResponse {
  status: AiStatus;
  answer: string;
  observations: Observation[];
  evidence: Evidence[];
  generatedAt: string;
}

export interface Appointment {
  id: string;
  departmentCode: string;
  departmentName: string;
  scheduledStart: string;
  scheduledEnd: string | null;
  status: string;
  reason: string | null;
}

export interface DashboardAppointment {
  appointmentId: string;
  patientId: string;
  patientNumber: string;
  patientName: string;
  departmentCode: string;
  departmentName: string;
  scheduledStart: string;
  status: string;
  reason: string | null;
}

export interface PatientListItem {
  id: string;
  patientNumber: string;
  name: string;
  birthDate: string;
  age: number;
  sexCode: string;
  departmentCode: string | null;
  departmentName: string | null;
  lastEncounterAt: string | null;
  nextAppointmentAt: string | null;
  attentionCount: number;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface PatientHeader {
  id: string;
  patientNumber: string;
  name: string;
  birthDate: string;
  age: number;
  sexCode: string;
  departmentCode: string | null;
  departmentName: string | null;
  lastEncounterAt: string | null;
  synthetic: boolean;
}

export interface PrescriptionItem {
  id: string;
  medicationCode: string;
  medicationName: string;
  doseValue: number;
  doseUnit: string;
  frequencyPerDay: number;
  route: string | null;
  startDate: string;
  endDate: string | null;
  instructions: string | null;
}

export interface Prescription {
  id: string;
  prescribedAt: string;
  status: string;
  items: PrescriptionItem[];
}

export interface PatientSummary {
  text: string;
  observations: Observation[];
  evidence: Evidence[];
  missingRecordCategories: string[];
}

export interface PatientDetail {
  header: PatientHeader;
  nextAppointment?: Appointment | null;
  currentPrescriptions: Prescription[];
  summary: PatientSummary;
}

export interface TimelineItem {
  evidenceId: string;
  type: string;
  occurredAt: string;
  title: string;
  description: string;
}

export interface MeasurementPoint {
  evidenceId: string;
  occurredAt: string;
  value: number;
  referenceMin: number | null;
  referenceMax: number | null;
  abnormalFlag: string | null;
}

export interface MeasurementSeries {
  metricCode: string;
  displayName: string;
  unit: string;
  points: MeasurementPoint[];
  trendDirection: TrendDirection;
  delta: number | null;
}

export interface DashboardResponse {
  todayAppointments: DashboardAppointment[];
  patientsNeedingReview: PatientListItem[];
}

export interface PatientSearchParams {
  q?: string;
  department?: string;
  appointmentStatus?: string;
  page?: number;
  size?: number;
  sort?: string;
}
