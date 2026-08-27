import { describe, expect, it } from "vitest";
import { applyPublicEnv } from "./public-env";

describe("public root environment allowlist", () => {
  it("copies only explicitly public frontend values", () => {
    const target: Record<string, string | undefined> = {};

    applyPublicEnv(
      {
        NEXT_PUBLIC_API_BASE_URL: "https://api.patienty.test",
        DATABASE_URL: "postgres://user:secret@example.test/db",
        SESSION_SECRET: "never-expose-this",
      },
      target,
    );

    expect(target).toEqual({
      NEXT_PUBLIC_API_BASE_URL: "https://api.patienty.test",
    });
    expect(target.DATABASE_URL).toBeUndefined();
    expect(target.SESSION_SECRET).toBeUndefined();
  });

  it("keeps a hosting environment value ahead of a file value", () => {
    const target = {
      NEXT_PUBLIC_API_BASE_URL: "https://host-provided.test",
    };

    applyPublicEnv(
      { NEXT_PUBLIC_API_BASE_URL: "https://file-provided.test" },
      target,
    );

    expect(target.NEXT_PUBLIC_API_BASE_URL).toBe(
      "https://host-provided.test",
    );
  });
});
