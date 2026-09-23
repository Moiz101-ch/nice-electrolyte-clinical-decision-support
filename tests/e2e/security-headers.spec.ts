import { expect, test } from "@playwright/test";

test("serves security headers and no-store clinical routes", async ({ page, request }) => {
  for (const path of ["/", "/review/dka/steps-one-to-four", "/assessment/new", "/api/health"]) {
    const response = await request.get(path);
    expect(response.ok(), `${path} should respond successfully`).toBe(true);
    const headers = response.headers();
    const csp = headers["content-security-policy"] ?? "";

    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["x-frame-options"]).toBe("DENY");
    expect(headers["referrer-policy"]).toBe("no-referrer");
    if (path.startsWith("/review/") || path.startsWith("/assessment/") || path === "/api/health") {
      if (path === "/api/health" || !csp.includes("'unsafe-eval'")) {
        expect(headers["cache-control"]).toContain("no-store");
      } else {
        expect(headers["cache-control"]).toMatch(/no-store|no-cache/);
      }
    }
  }

  const cspErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error" && /content security policy/i.test(message.text())) {
      cspErrors.push(message.text());
    }
  });
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.goto("/review/hypocalcaemia/assessment");
  await page
    .getByRole("spinbutton", { name: /Latest adjusted serum calcium result/i })
    .fill("1.85");
  await page.getByText("Adjustment confirmed", { exact: true }).click();
  await expect(page.getByRole("heading", { name: "Moderate/severe hypocalcaemia" })).toBeVisible();
  expect(cspErrors).toEqual([]);
});
