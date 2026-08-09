import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();

const retiredActivePaths = [
  "components/assessment",
  "components/results",
  "data/runtime",
  "project-input/nice_electrolyte_rule_catalogue.json",
  "project-input/nice_electrolyte_synthetic_cases.csv",
  "requirements.txt",
  "src/assessment",
  "src/clinical-data",
  "src/extraction",
  "src/rule-engine",
] as const;

const archivedEvidencePaths = [
  "archive/legacy-nice-prototype/README.md",
  "archive/legacy-nice-prototype/data/runtime/nice-rule-catalogue.json",
  "archive/legacy-nice-prototype/project-input/nice_electrolyte_project_package.xlsx",
  "archive/legacy-nice-prototype/project-input/nice_electrolyte_synthetic_cases.csv",
  "archive/legacy-nice-prototype/requirements.txt",
  "archive/legacy-nice-prototype/src/rule-engine/engine.ts",
] as const;

describe("legacy architecture retirement", () => {
  it("removes obsolete catalogue dependencies from active paths", async () => {
    await expect(Promise.all(retiredActivePaths.map(pathExists))).resolves.toEqual(
      retiredActivePaths.map(() => false),
    );
  });

  it("preserves selected historical evidence in the isolated archive", async () => {
    await expect(Promise.all(archivedEvidencePaths.map(pathExists))).resolves.toEqual(
      archivedEvidencePaths.map(() => true),
    );
  });

  it("keeps obsolete scripts and Python setup out of package and CI configuration", async () => {
    const packageJson = JSON.parse(await readFile(resolve(root, "package.json"), "utf8")) as {
      scripts: Record<string, string>;
    };
    const workflow = await readFile(resolve(root, ".github/workflows/ci.yml"), "utf8");

    expect(Object.keys(packageJson.scripts)).not.toEqual(
      expect.arrayContaining([
        "data:build",
        "data:check",
        "data:sync-cases",
        "extraction:demo",
        "hyperkalaemia:demo",
        "remaining-rules:demo",
        "rule-engine:demo",
      ]),
    );
    expect(workflow).not.toMatch(/setup-python|requirements\.txt|data:check/);
  });
});

async function pathExists(relativePath: string): Promise<boolean> {
  try {
    await access(resolve(root, relativePath));
    return true;
  } catch {
    return false;
  }
}
