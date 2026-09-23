import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import nextConfig from "@/next.config";

describe("security and privacy guardrails", () => {
  it("configures a restrictive baseline CSP and response headers", async () => {
    const rules = await nextConfig.headers?.();
    const global = rules?.find(({ source }) => source === "/:path*");
    const headers = new Map(global?.headers.map(({ key, value }) => [key, value]));
    const csp = headers.get("Content-Security-Policy") ?? "";

    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("script-src 'self' 'unsafe-inline'");
    expect(csp).not.toContain("'unsafe-eval'");
    expect(csp).toContain("connect-src 'self'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("base-uri 'self'");
    expect(csp).toContain("form-action 'self'");
    expect(headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(headers.get("X-Frame-Options")).toBe("DENY");
    expect(headers.get("Referrer-Policy")).toBe("no-referrer");
    expect(headers.get("Strict-Transport-Security")).toBe("max-age=31536000");
    expect(headers.get("Permissions-Policy")).toContain("camera=()");
  });

  it("disables caching for clinical review and assessment routes", async () => {
    const rules = await nextConfig.headers?.();
    for (const path of ["/review/:path*", "/assessment/:path*"]) {
      expect(rules?.find(({ source }) => source === path)?.headers).toContainEqual({
        key: "Cache-Control",
        value: "no-store",
      });
    }
  });

  it("does not persist or log assessment values in application runtime code", () => {
    const roots = ["app", "components/pathways", "src/clinical"];
    const prohibited =
      /\b(?:localStorage|sessionStorage|indexedDB|sendBeacon)\b|document\.cookie|console\.(?:log|warn|error|debug|info)\s*\(/;

    for (const root of roots) {
      for (const path of sourceFiles(resolve(process.cwd(), root))) {
        expect(
          readFileSync(path, "utf8"),
          `${path} must not persist or log clinical inputs`,
        ).not.toMatch(prohibited);
      }
    }
  });

  it("disables Worker log persistence and Wrangler telemetry by default", () => {
    const config = readFileSync(resolve(process.cwd(), "wrangler.jsonc"), "utf8");

    expect(config).toMatch(/"send_metrics"\s*:\s*false/);
    expect(config).toMatch(/"dependencies_instrumentation"\s*:\s*\{\s*"enabled"\s*:\s*false/);
    expect(config).toMatch(/"observability"\s*:\s*\{\s*"enabled"\s*:\s*false/);
  });
});

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(directory, entry.name);
    return entry.isDirectory() ? sourceFiles(path) : /\.(?:ts|tsx)$/.test(entry.name) ? [path] : [];
  });
}
