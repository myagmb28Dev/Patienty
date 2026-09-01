import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider, useAuth } from "@/features/auth/auth-provider";
import { authApi } from "@/lib/api/client";

const mockPush = vi.fn();
let currentPathname = "/";

vi.mock("next/navigation", () => ({
  usePathname: () => currentPathname,
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
  }),
}));

vi.mock("@/lib/api/client", () => ({
  authApi: {
    me: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
    changePassword: vi.fn(),
  },
}));

function ConsumerComponent() {
  const { clinician, status } = useAuth();
  return (
    <div>
      <div data-testid="status">{status}</div>
      <div data-testid="clinician">{clinician?.name ?? "none"}</div>
    </div>
  );
}

describe("AuthProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    currentPathname = "/";
  });

  it("sets unauthenticated status when on /login without checking api", async () => {
    currentPathname = "/login";
    render(
      <AuthProvider>
        <ConsumerComponent />
      </AuthProvider>,
    );

    expect(screen.getByTestId("status")).toHaveTextContent("unauthenticated");
    expect(authApi.me).not.toHaveBeenCalled();
  });

  it("sets unauthenticated status when no session hint exists", async () => {
    render(
      <AuthProvider>
        <ConsumerComponent />
      </AuthProvider>,
    );

    expect(screen.getByTestId("status")).toHaveTextContent("unauthenticated");
    expect(authApi.me).not.toHaveBeenCalled();
  });

  it("fetches current clinician when session hint exists", async () => {
    window.localStorage.setItem("patienty:has_session", "1");
    vi.mocked(authApi.me).mockResolvedValueOnce({
      id: "clinician-1",
      email: "doctor@patienty.local",
      name: "홍길동",
      role: "DOCTOR",
    });

    render(
      <AuthProvider>
        <ConsumerComponent />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("status")).toHaveTextContent("authenticated");
    });
    expect(screen.getByTestId("clinician")).toHaveTextContent("홍길동");
    expect(authApi.me).toHaveBeenCalledTimes(1);
  });
});
