import { spawn } from "node:child_process";
import { once } from "node:events";
import path from "node:path";

const root = process.cwd();
const port = process.env.PLAYWRIGHT_PORT ?? "3100";
const baseUrl = `http://127.0.0.1:${port}`;
const nextCli = path.join(root, "node_modules", "next", "dist", "bin", "next");
const playwrightCli = path.join(root, "node_modules", "@playwright", "test", "cli.js");

function start(command, args, options = {}) {
  return spawn(command, args, {
    cwd: root,
    env: process.env,
    windowsHide: true,
    ...options,
  });
}

async function waitForServer(server) {
  const deadline = Date.now() + 30_000;

  while (Date.now() < deadline) {
    if (server.exitCode !== null) {
      throw new Error(`Next.js exited before becoming ready with code ${server.exitCode}.`);
    }

    try {
      const response = await fetch(baseUrl, { signal: AbortSignal.timeout(2_000) });
      if (response.ok) return;
    } catch {
      // The server is still starting.
    }

    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  throw new Error(`Next.js did not become ready at ${baseUrl}.`);
}

async function stopServer(server) {
  if (!server.pid || server.exitCode !== null) return;

  const closed = once(server, "close").then(() => true);
  server.kill("SIGTERM");

  if (
    await Promise.race([closed, new Promise((resolve) => setTimeout(() => resolve(false), 5_000))])
  ) {
    return;
  }

  if (process.platform === "win32" && server.pid) {
    const taskkill = start("taskkill.exe", ["/PID", String(server.pid), "/T", "/F"], {
      stdio: "ignore",
    });
    await Promise.race([
      once(taskkill, "close"),
      new Promise((resolve) => setTimeout(resolve, 5_000)),
    ]);
    return;
  }

  server.kill("SIGKILL");
}

const server = start(
  process.execPath,
  [nextCli, "start", "--hostname", "127.0.0.1", "--port", port],
  { stdio: ["ignore", "inherit", "inherit"] },
);

let exitCode = 1;

try {
  await waitForServer(server);

  const tests = start(process.execPath, [playwrightCli, "test", ...process.argv.slice(2)], {
    env: {
      ...process.env,
      PLAYWRIGHT_PORT: port,
      PLAYWRIGHT_EXTERNAL_SERVER: "1",
    },
    stdio: "inherit",
  });

  const [code] = await once(tests, "close");
  exitCode = code ?? 1;
} finally {
  await stopServer(server);
}

process.exitCode = exitCode;
