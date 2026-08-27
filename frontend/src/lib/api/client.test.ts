import { beforeEach, describe, expect, it, vi } from "vitest";

const clinician = {
  id: "clinician-1",
  name: "김의사",
  email: "doctor@patienty.dev",
  role: "CLINICIAN",
};

describe("typed API client", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("keeps the CSRF token in memory and sends session credentials", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ token: "csrf-token", headerName: "X-CSRF-TOKEN" }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify(clinician), { status: 200 }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ token: "rotated-token", headerName: "X-CSRF-TOKEN" }),
          { status: 200 },
        ),
      );
    vi.stubGlobal("fetch", fetchMock);

    const { authApi } = await import("@/lib/api/client");
    await expect(
      authApi.login("doctor@patienty.dev", "strong-password"),
    ).resolves.toEqual(clinician);

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[0][0]).toContain("/api/v1/auth/csrf");
    expect(fetchMock.mock.calls[2][0]).toContain("/api/v1/auth/csrf");

    const loginOptions = fetchMock.mock.calls[1][1] as RequestInit;
    const headers = loginOptions.headers as Headers;
    expect(loginOptions.credentials).toBe("include");
    expect(headers.get("X-CSRF-TOKEN")).toBe("csrf-token");
    expect(JSON.parse(String(loginOptions.body))).toEqual({
      email: "doctor@patienty.dev",
      password: "strong-password",
    });
  });

  it("notifies the auth boundary when an authenticated request returns 401", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 401 }));
    vi.stubGlobal("fetch", fetchMock);
    const unauthorized = vi.fn();
    window.addEventListener("patienty:unauthorized", unauthorized);

    const { patientsApi } = await import("@/lib/api/client");
    await expect(patientsApi.detail("patient-1")).rejects.toMatchObject({
      status: 401,
    });
    expect(unauthorized).toHaveBeenCalledOnce();

    window.removeEventListener("patienty:unauthorized", unauthorized);
  });

  it("serializes server-side patient filters and pagination", async () => {
    const page = {
      content: [],
      page: 2,
      size: 10,
      totalElements: 0,
      totalPages: 0,
    };
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify(page), { status: 200 }),
      );
    vi.stubGlobal("fetch", fetchMock);

    const { patientsApi } = await import("@/lib/api/client");
    await patientsApi.list({
      q: "PAT-000124",
      department: "INTERNAL_MEDICINE",
      appointmentStatus: "SCHEDULED",
      page: 2,
      size: 10,
    });

    const url = String(fetchMock.mock.calls[0][0]);
    expect(url).toContain("q=PAT-000124");
    expect(url).toContain("department=INTERNAL_MEDICINE");
    expect(url).toContain("appointmentStatus=SCHEDULED");
    expect(url).toContain("sort=lastEncounterAt%2Cdesc");
    expect(url).toContain("page=2");
    expect((fetchMock.mock.calls[0][1] as RequestInit).credentials).toBe(
      "include",
    );
  });
});
