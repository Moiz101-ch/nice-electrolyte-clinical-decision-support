import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { ZodError } from "zod";

import { verifyClinicalSourceIntegrity } from "../src/clinical/sources/integrity.ts";
import { loadClinicalSourceRegistry } from "../src/clinical/sources/registry.ts";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

async function run(): Promise<void> {
  try {
    const registry = loadClinicalSourceRegistry();
    const verified = await verifyClinicalSourceIntegrity(registry, repositoryRoot);

    console.log(
      `Clinical source registry ${registry.registryVersion} is valid; verified ${verified.length} immutable files.`,
    );
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      console.error(
        error.issues
          .map(
            (issue) =>
              `${issue.path.length === 0 ? "root" : issue.path.join(".")}: ${issue.message}`,
          )
          .join("\n"),
      );
    } else {
      console.error(error instanceof Error ? error.message : error);
    }

    process.exitCode = 1;
  }
}

void run();
