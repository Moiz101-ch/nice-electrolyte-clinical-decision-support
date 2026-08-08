import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { ZodError } from "zod";

import { parseCsvRecords } from "../src/clinical-data/csv.ts";
import {
  createRuntimeNiceRuleCatalogue,
  createRuntimeResourceConfiguration,
  formatValidationError,
  validateNiceRuleCatalogue,
  validateResourceSearchConfiguration,
} from "../src/clinical-data/runtime-data.ts";

const rootDirectory = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sourceDirectory = resolve(rootDirectory, "project-input");
const outputDirectory = resolve(rootDirectory, "data", "runtime");
const checkOnly = process.argv.slice(2).includes("--check");

const outputFiles = [
  {
    path: resolve(outputDirectory, "nice-rule-catalogue.json"),
    content: async () => {
      const rawCatalogue = JSON.parse(
        await readFile(resolve(sourceDirectory, "nice_electrolyte_rule_catalogue.json"), "utf8"),
      );

      return `${JSON.stringify(createRuntimeNiceRuleCatalogue(validateNiceRuleCatalogue(rawCatalogue)), null, 2)}\n`;
    },
  },
  {
    path: resolve(outputDirectory, "nice-resource-configuration.json"),
    content: async () => {
      const rawResources = parseCsvRecords(
        await readFile(
          resolve(sourceDirectory, "nice_electrolyte_resource_search_config.csv"),
          "utf8",
        ),
      );

      return `${JSON.stringify(
        createRuntimeResourceConfiguration(validateResourceSearchConfiguration(rawResources)),
        null,
        2,
      )}\n`;
    },
  },
];

async function run(): Promise<void> {
  try {
    await validateManagementRuleParity();

    const generatedOutputs = await Promise.all(
      outputFiles.map(async (output) => ({
        ...output,
        generatedContent: await output.content(),
      })),
    );

    if (checkOnly) {
      const staleFiles: string[] = [];

      for (const output of generatedOutputs) {
        try {
          const existingContent = await readFile(output.path, "utf8");

          if (
            normalizeLineEndings(existingContent) !== normalizeLineEndings(output.generatedContent)
          ) {
            staleFiles.push(output.path);
          }
        } catch (error: unknown) {
          if (isMissingFileError(error)) {
            staleFiles.push(output.path);
          } else {
            throw error;
          }
        }
      }

      if (staleFiles.length > 0) {
        throw new Error(
          `Runtime data is missing or stale:\n${staleFiles.join("\n")}\nRun npm run data:build.`,
        );
      }

      console.log("Runtime data is valid and current.");
      return;
    }

    await mkdir(outputDirectory, { recursive: true });
    await Promise.all(
      generatedOutputs.map((output) => writeFile(output.path, output.generatedContent, "utf8")),
    );
    console.log(`Generated ${generatedOutputs.length} validated runtime data files.`);
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      console.error(`Clinical data validation failed:\n${formatValidationError(error)}`);
    } else {
      console.error(error instanceof Error ? error.message : error);
    }

    process.exitCode = 1;
  }
}

async function validateManagementRuleParity(): Promise<void> {
  const catalogue = validateNiceRuleCatalogue(
    JSON.parse(
      await readFile(resolve(sourceDirectory, "nice_electrolyte_rule_catalogue.json"), "utf8"),
    ),
  );
  const managementRules = parseCsvRecords(
    await readFile(resolve(sourceDirectory, "nice_electrolyte_management_rules.csv"), "utf8"),
  );

  if (JSON.stringify(managementRules) !== JSON.stringify(catalogue.rules)) {
    throw new Error(
      "The management-rules CSV does not exactly match the authoritative NICE JSON catalogue.",
    );
  }
}

function isMissingFileError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error && error.code === "ENOENT";
}

function normalizeLineEndings(value: string): string {
  return value.replaceAll("\r\n", "\n");
}

void run();
