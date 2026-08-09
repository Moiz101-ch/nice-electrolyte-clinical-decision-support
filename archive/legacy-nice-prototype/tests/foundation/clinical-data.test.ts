import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { parseCsvRecords } from "@/src/clinical-data/csv";
import {
  createRuntimeNiceRuleCatalogue,
  createRuntimeResourceConfiguration,
  validateNiceRuleCatalogue,
  validateResourceSearchConfiguration,
} from "@/src/clinical-data/runtime-data";
import {
  runtimeNiceRuleCatalogueSchema,
  runtimeResourceConfigurationSchema,
} from "@/src/clinical-data/schemas";

const rootDirectory = process.cwd();
const projectInputDirectory = resolve(rootDirectory, "project-input");
const runtimeDataDirectory = resolve(rootDirectory, "data", "runtime");

async function readJson(path: string): Promise<unknown> {
  return JSON.parse(await readFile(path, "utf8"));
}

describe("clinical data", () => {
  it("validates the supplied NICE rule catalogue and preserves its source references", async () => {
    const catalogue = validateNiceRuleCatalogue(
      await readJson(resolve(projectInputDirectory, "nice_electrolyte_rule_catalogue.json")),
    );

    expect(catalogue.management_source_policy).toBe("NICE-only");
    expect(catalogue.catalogue_version).toBe("1.1.0");
    expect(catalogue.checked_on).toBe("2026-08-09");
    expect(catalogue.rules).toHaveLength(17);
    expect(catalogue.sources).toHaveLength(8);
    expect(
      catalogue.rules.find((rule) => rule.rule_id === "NICE-UNSUPPORTED-001")?.nice_source_ids,
    ).toBe("");
  });

  it("keeps the management CSV exactly aligned with the authoritative JSON catalogue", async () => {
    const catalogue = validateNiceRuleCatalogue(
      await readJson(resolve(projectInputDirectory, "nice_electrolyte_rule_catalogue.json")),
    );
    const managementRows = parseCsvRecords(
      await readFile(
        resolve(projectInputDirectory, "nice_electrolyte_management_rules.csv"),
        "utf8",
      ),
    );

    expect(managementRows).toEqual(catalogue.rules);
  });

  it("keeps every synthetic expected result aligned with catalogue version 1.1.0", async () => {
    const catalogue = validateNiceRuleCatalogue(
      await readJson(resolve(projectInputDirectory, "nice_electrolyte_rule_catalogue.json")),
    );
    const rulesById = new Map(catalogue.rules.map((rule) => [rule.rule_id, rule]));
    const cases = parseCsvRecords(
      await readFile(
        resolve(projectInputDirectory, "nice_electrolyte_synthetic_cases.csv"),
        "utf8",
      ),
    );

    expect(cases).toHaveLength(1000);
    expect(cases.filter((entry) => entry.rule_id === "NICE-UNSUPPORTED-001")).toHaveLength(693);
    expect(cases.some((entry) => entry.rule_id === "NICE-GLOBAL-ASSESS-001")).toBe(false);
    expect(cases.some((entry) => entry.rule_id === "NICE-K-PATIROMER-ELIG-001")).toBe(false);

    for (const syntheticCase of cases) {
      const ruleId = syntheticCase.rule_id ?? "";
      const rule = rulesById.get(ruleId);

      expect(rule, `${syntheticCase.case_id} references ${ruleId}`).toBeDefined();
      expect(syntheticCase).toMatchObject({
        clinician_review_status: rule?.clinician_review_status,
        limitations: rule?.limitations,
        management_output: rule?.management_output,
        nice_sections: rule?.nice_sections,
        nice_source_ids: rule?.nice_source_ids,
        output_priority: rule?.output_priority,
        output_status: rule?.output_status,
      });
    }
  });

  it("validates the supplied resource configuration and converts numeric limits", async () => {
    const resourceRows = parseCsvRecords(
      await readFile(
        resolve(projectInputDirectory, "nice_electrolyte_resource_search_config.csv"),
        "utf8",
      ),
    );
    const resources = validateResourceSearchConfiguration(resourceRows);
    const runtimeResources = createRuntimeResourceConfiguration(resources);

    expect(resources).toHaveLength(8);
    expect(runtimeResources[0]).toMatchObject({
      condition: "Hyponatraemia",
      secondarySources: ["Europe PMC", "PubMed"],
      resultLimit: 5,
      cacheDays: 7,
    });
  });

  it("rejects unsafe source metadata and resource-policy changes", async () => {
    const rawCatalogue = (await readJson(
      resolve(projectInputDirectory, "nice_electrolyte_rule_catalogue.json"),
    )) as { rules: Array<Record<string, unknown>> };
    const invalidCatalogue = structuredClone(rawCatalogue);
    invalidCatalogue.rules[0] = {
      ...invalidCatalogue.rules[0],
      nice_source_ids: "NICE-NOT-REAL",
    };

    expect(() => validateNiceRuleCatalogue(invalidCatalogue)).toThrow(
      /unknown NICE source NICE-NOT-REAL/i,
    );

    const invalidResources = parseCsvRecords(
      await readFile(
        resolve(projectInputDirectory, "nice_electrolyte_resource_search_config.csv"),
        "utf8",
      ),
    );
    invalidResources[0] = {
      ...invalidResources[0],
      primary_management_source: "Europe PMC",
    };

    expect(() => validateResourceSearchConfiguration(invalidResources)).toThrow(/NICE only/i);
  });

  it("keeps generated runtime copies validated and current with the source inputs", async () => {
    const catalogue = validateNiceRuleCatalogue(
      await readJson(resolve(projectInputDirectory, "nice_electrolyte_rule_catalogue.json")),
    );
    const resources = validateResourceSearchConfiguration(
      parseCsvRecords(
        await readFile(
          resolve(projectInputDirectory, "nice_electrolyte_resource_search_config.csv"),
          "utf8",
        ),
      ),
    );
    const [runtimeCatalogue, runtimeResources] = await Promise.all([
      readJson(resolve(runtimeDataDirectory, "nice-rule-catalogue.json")),
      readJson(resolve(runtimeDataDirectory, "nice-resource-configuration.json")),
    ]);

    expect(runtimeNiceRuleCatalogueSchema.parse(runtimeCatalogue)).toEqual(
      createRuntimeNiceRuleCatalogue(catalogue),
    );
    expect(runtimeResourceConfigurationSchema.parse(runtimeResources)).toEqual(
      createRuntimeResourceConfiguration(resources),
    );
  });
});
