import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { parseCsvRecords } from "../src/clinical-data/csv.ts";
import { extractClinicalNote } from "../src/extraction/extract-clinical-note.ts";

const rootDirectory = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const casesPath = resolve(rootDirectory, "project-input", "nice_electrolyte_synthetic_cases.csv");
const exampleCaseIds = ["CASE-0061", "CASE-0363", "CASE-0589"];

const fieldSummary = <T>({
  candidates,
  status,
  value,
}: {
  candidates: T[];
  status: string;
  value: T | null;
}) => ({
  candidates,
  status,
  value,
});

async function run(): Promise<void> {
  const cases = parseCsvRecords(await readFile(casesPath, "utf8"));
  const examples = exampleCaseIds.map((caseId) => {
    const syntheticCase = cases.find((entry) => entry.case_id === caseId);

    if (syntheticCase?.note_text === undefined) {
      throw new Error(`Synthetic example ${caseId} was not found.`);
    }

    const extraction = extractClinicalNote(syntheticCase.note_text);

    return {
      caseId,
      datasetRuleIdForTraceability: syntheticCase.rule_id,
      extraction: {
        baselineValue: fieldSummary(extraction.baselineValue),
        ckdStage: fieldSummary(extraction.ckdStage),
        dialysis: fieldSummary(extraction.dialysis),
        egfr: fieldSummary(extraction.egfr),
        electrolyte: fieldSummary(extraction.electrolyte),
        onIvFluids: fieldSummary(extraction.onIvFluids),
        statedCondition: fieldSummary(extraction.statedCondition),
        unit: fieldSummary(extraction.unit),
        value: fieldSummary(extraction.value),
        conflicts: extraction.conflicts,
      },
      note: "The dataset rule ID is shown only for traceability; this command does not evaluate rules.",
    };
  });

  console.log(JSON.stringify(examples, null, 2));
}

void run();
