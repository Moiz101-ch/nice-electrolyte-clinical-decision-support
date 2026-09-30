import { expect, test } from "@playwright/test";

const publicRoutes = [
  { heading: "Acute electrolyte management", path: "/" },
  { heading: "Choose an assessment", path: "/assessment/new" },
  { heading: "Shared pathway UI framework", path: "/review/pathway-ui" },
  { heading: "Hyponatraemia assessment", path: "/review/hyponatraemia/assessment" },
  { heading: "Sodium severity review", path: "/review/hyponatraemia/severity" },
  { heading: "Fluid-status workflow review", path: "/review/hyponatraemia/fluid-status" },
  {
    heading: "Hyponatraemia emergency management",
    path: "/review/hyponatraemia/emergency-management",
  },
  {
    heading: "Urine and osmolality classification",
    path: "/review/hyponatraemia/classification",
  },
  { heading: "Hyponatraemia operational result", path: "/review/hyponatraemia/result" },
  { heading: "Hyperkalaemia timed management", path: "/review/hyperkalaemia/assessment" },
  { heading: "Potassium severity review", path: "/review/hyperkalaemia/severity" },
  {
    heading: "Hypocalcaemia assessment and management",
    path: "/review/hypocalcaemia/assessment",
  },
  {
    heading: "Hypomagnesaemia supporting guidance",
    path: "/review/hypomagnesaemia/supporting-guidance",
  },
  { heading: "Connected DKA calculator", path: "/review/dka/current-calculator" },
  { heading: "DKA source-currentness gate", path: "/review/dka/source-currentness" },
  { heading: "DKA calculator foundation", path: "/review/dka/calculator" },
  { heading: "DKA connected calculator", path: "/review/dka/connected-calculator" },
  { heading: "DKA Steps 1–4", path: "/review/dka/steps-one-to-four" },
  { heading: "DKA Steps 5-10", path: "/review/dka/steps-five-to-ten" },
] as const;

test.describe("Cloudflare deployment smoke", () => {
  test.describe.configure({ timeout: 120_000 });

  test("serves a healthy API with production security and cache headers", async ({ request }) => {
    const response = await request.get("/api/health");

    expect(response.status()).toBe(200);
    expect(await response.json()).toMatchObject({ status: "ok" });
    expect(response.headers()["cache-control"]).toContain("no-store");
    expect(response.headers()["content-type"]).toContain("application/json");
    expect(response.headers()["content-security-policy"]).toContain("default-src 'self'");
    expect(response.headers()["x-content-type-options"]).toBe("nosniff");
  });

  for (const route of publicRoutes) {
    test(`${route.path} renders its public production shell`, async ({ page }) => {
      const pageErrors: string[] = [];
      page.on("pageerror", (error) => pageErrors.push(error.message));

      const response = await page.goto(route.path, { waitUntil: "domcontentloaded" });

      expect(response?.status()).toBe(200);
      const heading = page.getByRole("heading", { level: 1, name: route.heading });

      try {
        await expect(heading).toBeVisible({ timeout: 15_000 });
      } catch {
        // A cold local workerd process can occasionally leave a streamed route on its loading shell.
        await page.reload({ waitUntil: "domcontentloaded" });
        await expect(heading).toBeVisible({ timeout: 30_000 });
      }
      expect(pageErrors).toEqual([]);

      const headers = response?.headers() ?? {};
      expect(headers["content-security-policy"]).toContain("default-src 'self'");
      expect(headers["x-content-type-options"]).toBe("nosniff");
      if (route.path.startsWith("/review/") || route.path.startsWith("/assessment/")) {
        expect(headers["cache-control"]).toContain("no-store");
      }
    });
  }
});
