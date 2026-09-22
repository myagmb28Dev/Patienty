import { afterEach, describe, expect, it, vi } from "vitest";
import nextConfig from "../next.config";

afterEach(() => vi.unstubAllEnvs());

describe("Azure API proxy", () => {
  it("proxies API paths to the private backend without exposing actuator paths", async () => {
    vi.stubEnv("API_PROXY_TARGET", "https://backend.example.test/");
    expect(await nextConfig.rewrites!()).toEqual([
      { source: "/api/:path*", destination: "https://backend.example.test/api/:path*" },
    ]);
  });

  it.each(["file:///etc/passwd", "https://user:secret@example.test", "https://example.test/path", "https://example.test?token=secret"])("rejects an invalid upstream %s", async (target) => {
    vi.stubEnv("API_PROXY_TARGET", target);
    await expect(nextConfig.rewrites!()).rejects.toThrow();
  });

  it("retains direct local API access when no proxy is configured", async () => {
    vi.stubEnv("API_PROXY_TARGET", "");
    expect(await nextConfig.rewrites!()).toEqual([]);
  });
});
