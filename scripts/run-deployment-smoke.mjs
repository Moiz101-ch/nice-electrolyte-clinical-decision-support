import { spawn } from "node:child_process";
import { once } from "node:events";
import path from "node:path";

const root = process.cwd();
const remoteBaseUrl = process.env.DEPLOYMENT_BASE_URL?.replace(/\/$/, "");
const port = process.env.CLOUDFLARE_PREVIEW_PORT ?? "8787";
const baseUrl = remoteBaseUrl ?? `http://127.0.0.1:${port}`;
const playwrightCli = path.join(root, "node_modules", "@playwright", "test", "cli.js");
const wranglerCli = path.join(root, "node_modules", "wrangler", "bin", "wrangler.js");

function start(command, args, options = {}) {
  return spawn(command, args, {
    cwd: root,
    env: process.env,
    windowsHide: true,
    ...options,
  });
}

async function waitForHealth(server) {
  const deadline = Date.now() + 60_000;

  while (Date.now() < deadline) {
    if (server?.exitCode !== null && server?.exitCode !== undefined) {
      throw new Error(
        `Cloudflare preview exited before becoming ready with code ${server.exitCode}.`,
      );
    }

    try {
      const response = await fetch(`${baseUrl}/api/health`, {
        signal: AbortSignal.timeout(5_000),
      });
      if (response.ok) return;
    } catch {
      // The preview or remote deployment is still becoming available.
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(`Deployment did not become healthy at ${baseUrl}.`);
}

async function stopServer(server) {
  if (!server?.pid || server.exitCode !== null) return;

  if (process.platform === "win32") {
    const taskkill = start("taskkill.exe", ["/PID", String(server.pid), "/T", "/F"], {
      stdio: "ignore",
    });
    await Promise.race([
      once(taskkill, "close"),
      new Promise((resolve) => setTimeout(resolve, 5_000)),
    ]);
    return;
  }

  const closed = once(server, "close").then(() => true);
  server.kill("SIGTERM");

  if (
    await Promise.race([closed, new Promise((resolve) => setTimeout(() => resolve(false), 5_000))])
  ) {
    return;
  }

  server.kill("SIGKILL");
}

const server = remoteBaseUrl
  ? null
  : start(process.execPath, [wranglerCli, "dev", "--port", port], {
      stdio: ["ignore", "inherit", "inherit"],
    });

let exitCode = 1;

try {
  await waitForHealth(server);

  const tests = start(
    process.execPath,
    [playwrightCli, "test", "tests/e2e/deployment-smoke.spec.ts", "--reporter=line"],
    {
      env: {
        ...process.env,
        PLAYWRIGHT_BASE_URL: baseUrl,
        PLAYWRIGHT_EXTERNAL_SERVER: "1",
      },
      stdio: "inherit",
    },
  );

  const [code] = await once(tests, "close");
  exitCode = code ?? 1;
} finally {
  await stopServer(server);
}

process.exit(exitCode);
