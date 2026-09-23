import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

import { chromium } from "@playwright/test";

const baseUrl = new URL(process.env.DKA_REVIEW_BASE_URL ?? "http://127.0.0.1:3000");
if (!["127.0.0.1", "localhost"].includes(baseUrl.hostname)) {
  throw new Error("DKA review screenshots may only be captured from a local server.");
}

const outputDirectory = resolve(process.cwd(), "docs/screenshots/subtask-25-dka");
await mkdir(outputDirectory, { recursive: true });

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(new URL("/review/dka/steps-one-to-four", baseUrl).href);
  await page.getByRole("combobox", { name: "Test scenario" }).selectOption("pressure-recovered");
  await page.getByRole("button", { name: /Step 4/i }).click();
  await page.getByRole("heading", { name: "Calculation audit" }).waitFor();
  await page.screenshot({
    path: resolve(outputDirectory, "initial-rate-desktop.png"),
    fullPage: true,
  });

  await page.getByRole("link", { name: /Review Steps 5-10/i }).click();
  await page.getByRole("button", { name: /Step 7/i }).click();
  await page.getByRole("heading", { name: "Urine-output calculation audit" }).waitFor();
  await page.screenshot({
    path: resolve(outputDirectory, "monitoring-desktop.png"),
    fullPage: true,
  });

  await page.getByRole("button", { name: /Step 9/i }).click();
  await page.getByRole("alert", { name: /Resolution rule is not executable/i }).waitFor();
  await page.screenshot({
    path: resolve(outputDirectory, "resolution-stop-desktop.png"),
    fullPage: true,
  });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("combobox", { name: "Test scenario" }).selectOption("inadequate-response");
  await page.getByRole("button", { name: /Step 8/i }).click();
  await page.getByText("Response below source targets", { exact: true }).waitFor();
  await page.addStyleTag({
    content:
      'header.sticky { position: static !important; } a[href="#main-content"] { visibility: hidden !important; }',
  });
  await page
    .getByRole("main")
    .screenshot({ path: resolve(outputDirectory, "response-review-mobile.png") });
} finally {
  await browser.close();
}
