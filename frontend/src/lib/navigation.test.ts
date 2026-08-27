import { describe, expect, it } from "vitest";
import { safeInternalPath } from "@/lib/navigation";

describe("safeInternalPath", () => {
  it.each([
    [null, "/"],
    ["https://evil.example", "/"],
    ["//evil.example/path", "/"],
    ["/\\evil.example/path", "/"],
    ["/patients\n", "/"],
    ["/patients/123?tab=summary", "/patients/123?tab=summary"],
  ])("maps %s to %s", (value, expected) => {
    expect(safeInternalPath(value)).toBe(expected);
  });
});
