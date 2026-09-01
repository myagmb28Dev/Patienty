import type {
  AiResponse,
  Clinician,
  CsrfResponse,
  DashboardResponse,
  MeasurementSeries,
  PageResponse,
  PatientDetail,
  PatientListItem,
  PatientSearchParams,
  TimelineItem,
} from "@/lib/api/types";

const configuredBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
export const API_BASE_URL = (configuredBaseUrl || "http://localhost:8080").replace(
  /\/$/,
  "",
);

type ProblemDetails = {
  title?: string;
  detail?: string;
  message?: string;
};

type RequestOptions = RequestInit & {
  notifyUnauthorized?: boolean;
  csrf?: boolean;
};

let csrfState: CsrfResponse | null = null;
let csrfPromise: Promise<CsrfResponse> | null = null;

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly details?: ProblemDetails,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function emitUnauthorized() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("patienty:unauthorized"));
  }
}

async function readError(response: Response): Promise<ApiError> {
  let details: ProblemDetails | undefined;

  try {
    details = (await response.json()) as ProblemDetails;
  } catch {
    details = undefined;
  }

  const message =
    details?.detail ||
    details?.message ||
    details?.title ||
    (response.status === 401
      ? "로그인이 필요합니다."
      : "요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.");

  return new ApiError(message, response.status, details);
}

async function loadCsrf(force = false): Promise<CsrfResponse> {
  if (!force && csrfState) return csrfState;
  if (!force && csrfPromise) return csrfPromise;

  csrfPromise = fetch(`${API_BASE_URL}/api/v1/auth/csrf`, {
    credentials: "include",
    headers: { Accept: "application/json" },
    cache: "no-store",
  }).then(async (response) => {
    if (!response.ok) throw await readError(response);
    const value = (await response.json()) as CsrfResponse;
    csrfState = value;
    return value;
  });

  try {
    return await csrfPromise;
  } finally {
    csrfPromise = null;
  }
}

async function request<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const {
    notifyUnauthorized = true,
    csrf = false,
    headers,
    ...init
  } = options;
  const requestHeaders = new Headers(headers);
  requestHeaders.set("Accept", "application/json");

  if (init.body && !requestHeaders.has("Content-Type")) {
    requestHeaders.set("Content-Type", "application/json");
  }

  if (csrf) {
    const csrfToken = await loadCsrf();
    requestHeaders.set(csrfToken.headerName, csrfToken.token);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: requestHeaders,
    cache: "no-store",
  });

  if (!response.ok) {
    if (response.status === 401 && notifyUnauthorized) emitUnauthorized();
    throw await readError(response);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

function toQuery(params: Record<string, string | number | undefined>) {
  const search = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") search.set(key, String(value));
  });

  const query = search.toString();
  return query ? `?${query}` : "";
}

function unwrapItems<T>(value: T[] | { items: T[] }): T[] {
  return Array.isArray(value) ? value : value.items;
}

export const authApi = {
  csrf: (force = false) => loadCsrf(force),
  login: async (email: string, password: string) => {
    const clinician = await request<Clinician>("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
      csrf: true,
      notifyUnauthorized: false,
    });
    void loadCsrf(true).catch(() => {});
    return clinician;
  },
  me: () =>
    request<Clinician>("/api/v1/auth/me", { notifyUnauthorized: false }),
  logout: async () => {
    try {
      await request<void>("/api/v1/auth/logout", {
        method: "POST",
        csrf: true,
      });
    } finally {
      csrfState = null;
    }
  },
  changePassword: (currentPassword: string, newPassword: string) =>
    request<void>("/api/v1/auth/password", {
      method: "POST",
      body: JSON.stringify({ currentPassword, newPassword }),
      csrf: true,
    }),
};

export const dashboardApi = {
  get: () => request<DashboardResponse>("/api/v1/dashboard"),
};

export const patientsApi = {
  list: (params: PatientSearchParams) =>
    request<PageResponse<PatientListItem>>(
      `/api/v1/patients${toQuery({
        q: params.q,
        department: params.department,
        appointmentStatus: params.appointmentStatus,
        page: params.page ?? 0,
        size: params.size ?? 10,
        sort: params.sort ?? "lastEncounterAt,desc",
      })}`,
    ),
  detail: (patientId: string) =>
    request<PatientDetail>(`/api/v1/patients/${patientId}`),
  timeline: async (patientId: string) =>
    unwrapItems(
      await request<TimelineItem[] | { items: TimelineItem[] }>(
        `/api/v1/patients/${patientId}/timeline`,
      ),
    ),
  measurements: async (patientId: string) =>
    unwrapItems(
      await request<MeasurementSeries[] | { items: MeasurementSeries[] }>(
        `/api/v1/patients/${patientId}/measurements`,
      ),
    ),
  ask: (patientId: string, question: string) =>
    request<AiResponse>(`/api/v1/patients/${patientId}/ai/queries`, {
      method: "POST",
      body: JSON.stringify({ question }),
      csrf: true,
    }),
  askStream: async (
    patientId: string,
    question: string,
    onChunk: (chunk: string) => void,
  ): Promise<AiResponse> => {
    const csrfToken = await loadCsrf();
    const response = await fetch(
      `${API_BASE_URL}/api/v1/patients/${patientId}/ai/queries/stream`,
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
          [csrfToken.headerName]: csrfToken.token,
        },
        body: JSON.stringify({ question }),
      },
    );

    if (!response.ok) {
      if (response.status === 401) emitUnauthorized();
      throw await readError(response);
    }

    if (!response.body) {
      return await patientsApi.ask(patientId, question);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";
    let finalResponse: AiResponse | null = null;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const events = buffer.split("\n\n");
      buffer = events.pop() ?? "";

      for (const eventBlock of events) {
        if (!eventBlock.trim()) continue;
        const lines = eventBlock.split("\n");
        let eventType = "message";
        let dataStr = "";

        for (const line of lines) {
          if (line.startsWith("event:")) {
            eventType = line.slice(6).trim();
          } else if (line.startsWith("data:")) {
            dataStr = line.slice(5).trim();
          }
        }

        if (eventType === "chunk" && dataStr) {
          try {
            const parsed = JSON.parse(dataStr) as { text: string };
            if (parsed.text) onChunk(parsed.text);
          } catch {
            // ignore malformed chunk
          }
        } else if (eventType === "done" && dataStr) {
          try {
            finalResponse = JSON.parse(dataStr) as AiResponse;
          } catch {
            // ignore malformed done event
          }
        } else if (eventType === "error" && dataStr) {
          try {
            const parsed = JSON.parse(dataStr) as { message: string };
            throw new Error(parsed.message || "스트리밍 중 오류가 발생했습니다.");
          } catch (e) {
            if (e instanceof Error) throw e;
            throw new Error("스트리밍 중 오류가 발생했습니다.");
          }
        }
      }
    }

    if (finalResponse) return finalResponse;
    return await patientsApi.ask(patientId, question);
  },
};

