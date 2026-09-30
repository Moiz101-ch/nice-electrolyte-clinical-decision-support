import { spawnSync } from "node:child_process";

const npmCli = process.env.npm_execpath;
if (!npmCli) {
  console.error("Run complete verification through `npm run test:complete`.");
  process.exit(1);
}

const npmRun = (script) => [process.execPath, [npmCli, "run", script]];
const checks = [
  ["Formatting", ...npmRun("format:check")],
  ["Lint", ...npmRun("lint")],
  ["TypeScript", ...npmRun("typecheck")],
  ["Clinical source integrity", ...npmRun("sources:check")],
  ["Unit, branch, boundary and coverage tests", ...npmRun("test:coverage")],
  ["Next.js production build", ...npmRun("build")],
  ["Production browser tests", process.execPath, ["scripts/run-e2e.mjs", "--reporter=line"]],
  ["Development-only DKA browser tests", ...npmRun("test:e2e:dka-preview")],
  ["Cloudflare production bundle", ...npmRun("cf:build")],
  ["Cloudflare package dry run", ...npmRun("cf:check")],
  ["Cloudflare Worker smoke tests", ...npmRun("test:deployment")],
];

for (const [label, command, args] of checks) {
  console.log(`\n=== ${label} ===`);
  const result = spawnSync(command, [...args], {
    cwd: process.cwd(),
    env: process.env,
    stdio: "inherit",
  });

  if (result.error) {
    console.error(`${label} could not start: ${result.error.message}`);
    process.exit(1);
  }

  if (result.status !== 0) {
    console.error(`${label} failed with exit code ${result.status ?? "unknown"}.`);
    process.exit(result.status ?? 1);
  }
}

console.log("\nComplete verification passed.");
