import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { parseCsvRecords } from "../src/clinical-data/csv.ts";
import { validateNiceRuleCatalogue } from "../src/clinical-data/runtime-data.ts";

const rootDirectory = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const inputDirectory = resolve(rootDirectory, "project-input");
const casesPath = resolve(inputDirectory, "nice_electrolyte_synthetic_cases.csv");
const cataloguePath = resolve(inputDirectory, "nice_electrolyte_rule_catalogue.json");
const checkOnly = process.argv.slice(2).includes("--check");

async function run(): Promise<void> {
  const original = await readFile(casesPath, "utf8");
  const rows = parseCsvRecords(original);
  const headers = Object.keys(rows[0] ?? {});
  const catalogue = validateNiceRuleCatalogue(JSON.parse(await readFile(cataloguePath, "utf8")));
  const rulesById = new Map(catalogue.rules.map((rule) => [rule.rule_id, rule]));
  const synchronized = rows.map((row) => {
    const ruleId = selectExpectedRuleId(row);
    const rule = rulesById.get(ruleId);

    if (rule === undefined) {
      throw new Error(`Synthetic case ${row.case_id} selected unknown rule ${ruleId}.`);
    }

    return {
      ...row,
      clinician_review_status: rule.clinician_review_status,
      limitations: rule.limitations,
      management_output: rule.management_output,
      nice_coverage_level:
        ruleId === "NICE-UNSUPPORTED-001"
          ? "No definitive NICE-only management"
          : (row.nice_coverage_level ?? ""),
      nice_sections: rule.nice_sections,
      nice_source_ids: rule.nice_source_ids,
      output_priority: rule.output_priority,
      output_status: rule.output_status,
      rule_id: rule.rule_id,
    };
  });
  const generated = serializeCsv(headers, synchronized);

  if (checkOnly) {
    if (normalizeLineEndings(original) !== normalizeLineEndings(generated)) {
      throw new Error(
        "Synthetic case expectations are stale. Run npm run data:sync-cases and review the clinical-data diff.",
      );
    }

    console.log(`Synthetic case expectations are current (${synchronized.length} rows).`);
    return;
  }

  await writeFile(casesPath, generated, "utf8");
  console.log(`Synchronized ${synchronized.length} synthetic case expectations.`);
}

function selectExpectedRuleId(row: Record<string, string>): string {
  const currentRuleId = row.rule_id;

  if (currentRuleId === undefined || currentRuleId.length === 0) {
    throw new Error(`Synthetic case ${row.case_id ?? "unknown"} has no rule ID.`);
  }

  if (currentRuleId === "NICE-GLOBAL-ASSESS-001") {
    return "NICE-UNSUPPORTED-001";
  }

  if (row.clinical_context === "Persistent hyperkalaemia") {
    return selectPersistentHyperkalaemiaRule(row);
  }

  if (
    row.clinical_context === "Confirmed primary hyperparathyroidism" &&
    row.confirmed_primary_hyperparathyroidism === "Yes"
  ) {
    return currentRuleId === "NICE-CA-PHPT-REFER-001"
      ? "NICE-CA-PHPT-REFER-001"
      : "NICE-CA-PHPT-CONSIDER-REFER-001";
  }

  return currentRuleId === "NICE-K-PATIROMER-ELIG-001"
    ? "NICE-K-BINDER-OPTIONS-001"
    : currentRuleId;
}

function selectPersistentHyperkalaemiaRule(row: Record<string, string>): string {
  const potassium = Number(row.measured_value);
  const eligibleIndication =
    ["3b", "4", "5"].includes(row.ckd_stage ?? "") || row.heart_failure === "Yes";
  const eligibleRaasStatuses = new Set([
    "Not optimised because of hyperkalaemia",
    "Not taking because of hyperkalaemia",
    "Reduced because of hyperkalaemia",
  ]);

  if (
    !Number.isFinite(potassium) ||
    !eligibleIndication ||
    row.dialysis !== "No" ||
    !eligibleRaasStatuses.has(row.raas_antagonist_status ?? "")
  ) {
    return "NICE-UNSUPPORTED-001";
  }

  if (
    potassium >= 6 &&
    ["Not taking because of hyperkalaemia", "Reduced because of hyperkalaemia"].includes(
      row.raas_antagonist_status ?? "",
    )
  ) {
    return "NICE-K-BINDER-OPTIONS-001";
  }

  return potassium >= 5.5 ? "NICE-K-SZC-ELIG-001" : "NICE-UNSUPPORTED-001";
}

function serializeCsv(headers: string[], rows: Record<string, string>[]): string {
  const lines = [headers.map(escapeCsvValue).join(",")];

  for (const row of rows) {
    lines.push(headers.map((header) => escapeCsvValue(row[header] ?? "")).join(","));
  }

  return `${lines.join("\n")}\n`;
}

function escapeCsvValue(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;
}

function normalizeLineEndings(value: string): string {
  return value.replaceAll("\r\n", "\n");
}

run().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
