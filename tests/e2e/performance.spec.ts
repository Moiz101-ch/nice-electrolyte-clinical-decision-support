import { expect, test, type Page } from "@playwright/test";

interface PerformanceAuditState {
  cls: number;
  largestContentfulPaint: number;
  longTasks: number;
}

const productionRoutes = [
  { heading: "Acute electrolyte management", path: "/" },
  { heading: "Choose an assessment", path: "/assessment/new" },
  { heading: "Hyponatraemia assessment", path: "/review/hyponatraemia/assessment" },
  { heading: "Hyperkalaemia timed management", path: "/review/hyperkalaemia/assessment" },
  {
    heading: "Hypocalcaemia assessment and management",
    path: "/review/hypocalcaemia/assessment",
  },
  { heading: "Connected DKA calculator", path: "/review/dka/current-calculator" },
] as const;

test.describe("Subtask 28 production performance budgets", () => {
  test.describe.configure({ timeout: 60_000 });

  for (const route of productionRoutes) {
    test(`${route.heading} stays inside production budgets`, async ({ page }, testInfo) => {
      await installPerformanceObservers(page);
      await page.goto(route.path);
      await expect(page.getByRole("heading", { level: 1, name: route.heading })).toBeVisible();
      await page.waitForLoadState("networkidle");

      const metrics = await page.evaluate(() => {
        const resources = performance.getEntriesByType("resource") as PerformanceResourceTiming[];
        const navigation = performance.getEntriesByType(
          "navigation",
        )[0] as PerformanceNavigationTiming;
        const audit = (window as typeof window & { __performanceAudit?: PerformanceAuditState })
          .__performanceAudit ?? {
          cls: 0,
          largestContentfulPaint: 0,
          longTasks: 0,
        };
        const sumDecodedBytes = (entries: PerformanceResourceTiming[]) =>
          entries.reduce((total, entry) => total + entry.decodedBodySize, 0);
        const scripts = resources.filter(
          ({ initiatorType, name }) =>
            initiatorType === "script" && name.includes("/_next/static/"),
        );
        const styles = resources.filter(
          ({ initiatorType, name }) =>
            initiatorType === "css" || (name.includes("/_next/static/") && name.endsWith(".css")),
        );
        const fontFiles = resources.filter(({ name }) => /\.(?:woff2?|ttf)(?:\?|$)/.test(name));

        return {
          cls: audit.cls,
          domContentLoaded: navigation.domContentLoadedEventEnd,
          domNodes: document.getElementsByTagName("*").length,
          fontBytes: sumDecodedBytes(fontFiles),
          fontFiles: fontFiles.length,
          largestContentfulPaint: audit.largestContentfulPaint,
          longTasks: audit.longTasks,
          scriptBytes: sumDecodedBytes(scripts),
          styleBytes: sumDecodedBytes(styles),
          totalResourceBytes: sumDecodedBytes(resources),
        };
      });

      await testInfo.attach("performance-metrics.json", {
        body: JSON.stringify({ route: route.path, ...metrics }, null, 2),
        contentType: "application/json",
      });

      expect(metrics.scriptBytes, "decoded JavaScript must stay below 800 KiB").toBeLessThan(
        800 * 1024,
      );
      expect(metrics.styleBytes, "decoded CSS must stay below 80 KiB").toBeLessThan(80 * 1024);
      expect(metrics.totalResourceBytes, "decoded resources must stay below 1.2 MiB").toBeLessThan(
        1.2 * 1024 * 1024,
      );
      expect(metrics.fontFiles, "only the optimized Inter subset should load").toBeLessThanOrEqual(
        1,
      );
      expect(metrics.fontBytes, "font payload must stay below 60 KiB").toBeLessThan(60 * 1024);
      expect(metrics.domNodes, "initial DOM must remain bounded").toBeLessThan(2_000);
      expect(metrics.cls, "CLS must remain in the good range").toBeLessThanOrEqual(0.1);
      expect(
        metrics.longTasks,
        "initial rendering must avoid repeated long tasks",
      ).toBeLessThanOrEqual(5);
      expect(metrics.domContentLoaded, "local production DCL must remain bounded").toBeLessThan(
        5_000,
      );
      expect(
        metrics.largestContentfulPaint,
        "local production LCP must remain bounded",
      ).toBeLessThan(5_000);
    });
  }

  for (const path of ["/", "/assessment/new"] as const) {
    test(`${path} does not prefetch every clinical workflow`, async ({ page }) => {
      const workflowRequests: string[] = [];
      page.on("request", (request) => {
        const url = new URL(request.url());
        if (url.pathname.startsWith("/review/")) workflowRequests.push(url.pathname);
      });

      await page.goto(path);
      await page.waitForLoadState("networkidle");

      expect(workflowRequests).toEqual([]);
    });
  }
});

async function installPerformanceObservers(page: Page) {
  await page.addInitScript(() => {
    const audit: PerformanceAuditState = {
      cls: 0,
      largestContentfulPaint: 0,
      longTasks: 0,
    };
    (window as typeof window & { __performanceAudit?: PerformanceAuditState }).__performanceAudit =
      audit;

    try {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const shift = entry as PerformanceEntry & { hadRecentInput: boolean; value: number };
          if (!shift.hadRecentInput) audit.cls += shift.value;
        }
      }).observe({ buffered: true, type: "layout-shift" });
    } catch {
      // Unsupported observers leave the metric at its fail-safe default.
    }

    try {
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        audit.largestContentfulPaint = entries.at(-1)?.startTime ?? 0;
      }).observe({ buffered: true, type: "largest-contentful-paint" });
    } catch {
      // Unsupported observers leave the metric at its fail-safe default.
    }

    try {
      new PerformanceObserver((list) => {
        audit.longTasks += list.getEntries().length;
      }).observe({ buffered: true, type: "longtask" });
    } catch {
      // Unsupported observers leave the metric at its fail-safe default.
    }
  });
}
