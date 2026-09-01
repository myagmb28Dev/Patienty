import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AiAssistant } from "@/features/assistant/ai-assistant";
import { patientsApi } from "@/lib/api/client";

vi.mock("@/lib/api/client", () => ({
  patientsApi: {
    ask: vi.fn(),
    askStream: vi.fn(),
  },
}));

describe("AI assistant", () => {
  beforeEach(() => {
    vi.mocked(patientsApi.askStream).mockImplementation(
      async (patientId, question, onChunk) => {
        onChunk("최근 혈압 수치가 ");
        onChunk("상승했습니다.");
        return {
          status: "ANSWERED",
          answer: "최근 혈압 수치가 상승했습니다.",
          observations: [
            {
              type: "MEASUREMENT_TREND",
              level: "ATTENTION",
              text: "수축기 혈압이 상승했습니다.",
              evidenceIds: ["examination-result:1"],
            },
          ],
          evidence: [
            {
              id: "examination-result:1",
              sourceType: "EXAMINATION_RESULT",
              occurredAt: "2026-08-20T09:30:00+09:00",
              label: "8월 20일 혈압 검사",
            },
          ],
          generatedAt: "2026-08-27T12:00:00+09:00",
        };
      },
    );
  });

  it("asks a suggested question and opens its source evidence", async () => {
    const user = userEvent.setup();
    const onEvidence = vi.fn();
    render(<AiAssistant patientId="patient-1" onEvidence={onEvidence} />);

    await user.click(
      screen.getByRole("button", {
        name: /지난 진료 이후 변경/,
      }),
    );

    await waitFor(() =>
      expect(patientsApi.askStream).toHaveBeenCalledWith(
        "patient-1",
        "지난 진료 이후 변경된 사항은?",
        expect.any(Function),
      ),
    );
    expect(await screen.findByText("최근 혈압 수치가 상승했습니다.")).toBeVisible();

    const evidenceButtons = screen.getAllByRole("button", {
      name: /8월 20일 혈압 검사/,
    });
    await user.click(evidenceButtons[0]);
    expect(onEvidence).toHaveBeenCalledWith("examination-result:1");
  });
});

