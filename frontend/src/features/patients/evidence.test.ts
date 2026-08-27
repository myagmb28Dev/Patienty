import { describe, expect, it } from "vitest";
import { evidenceTargetId, focusEvidence } from "@/features/patients/evidence";

describe("evidence navigation", () => {
  it("creates stable DOM-safe target ids", () => {
    expect(evidenceTargetId("examination-result:abc/123")).toBe(
      "evidence-examination-result-abc-123",
    );
  });

  it("scrolls to a rendered source record", () => {
    const element = document.createElement("div");
    element.id = evidenceTargetId("encounter:one");
    document.body.appendChild(element);

    expect(focusEvidence("encounter:one")).toBe(true);
    expect(element.scrollIntoView).toHaveBeenCalledWith({
      behavior: "smooth",
      block: "center",
    });
  });
  it("falls back to a grouped chart or prescription target", () => {
    const element = document.createElement("article");
    element.dataset.evidenceIds =
      "examination-result:first examination-result:older";
    document.body.appendChild(element);

    expect(focusEvidence("examination-result:older")).toBe(true);
    expect(element.scrollIntoView).toHaveBeenCalled();
  });


  it("reports when evidence is outside the loaded record window", () => {
    expect(focusEvidence("missing:evidence")).toBe(false);
  });
});
