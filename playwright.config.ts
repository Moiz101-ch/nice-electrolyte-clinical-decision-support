import { defineConfig, devices, type PlaywrightTestConfig } from "@playwright/test";

const usesExternalServer = process.env.PLAYWRIGHT_EXTERNAL_SERVER === "1";
const port = process.env.PLAYWRIGHT_PORT ?? "3100";
const baseURL = `http://127.0.0.1:${port}`;

const config: PlaywrightTestConfig = {
  expect: {
    timeout: 5_000,
  },
  forbidOnly: Boolean(process.env.CI),
  fullyParallel: true,
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  reporter: process.env.CI ? "github" : "html",
  retries: process.env.CI ? 2 : 0,
  testDir: "./tests/e2e",
  workers: 1,
  use: {
    baseURL,
    trace: "on-first-retry",
  },
};

if (!usesExternalServer) {
  config.webServer = {
    command: `node node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port ${port}`,
    env: {
      NEXT_TELEMETRY_DISABLED: "1",
    },
    reuseExistingServer: false,
    timeout: 60_000,
    url: baseURL,
  };
}

export default defineConfig(config);
