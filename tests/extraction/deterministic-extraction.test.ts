import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { parseCsvRecords } from "@/src/clinical-data/csv";
import { extractClinicalNote } from "@/src/extraction/extract-clinical-note";

describe("deterministic clinical-note extraction", () => {
  it("extracts explicit values, canonical units, kidney fields, IV-fluid status, and dialysis status", () => {
    const extraction = extractClinicalNote(
      "75-year-old female with hyponatraemia. Sodium is 126.8 mmol/L; baseline is 138.2 mmol/L. Context: IV-fluid-related. IV fluids: Yes; CKD stage: G3b; dialysis: No; eGFR: 27.2 mL/min/1.73m\u00b2.",
    );

    expect(extraction.age).toMatchObject({ status: "confirmed", value: 75 });
    expect(extraction.electrolyte).toMatchObject({ status: "confirmed", value: "sodium" });
    expect(extraction.statedCondition).toMatchObject({
      status: "confirmed",
      value: "hyponatraemia",
    });
    expect(extraction.value).toMatchObject({ status: "confirmed", value: 126.8 });
    expect(extraction.unit).toMatchObject({ status: "confirmed", value: "mmol/L" });
    expect(extraction.baselineValue).toMatchObject({ status: "confirmed", value: 138.2 });
    expect(extraction.ckdStage).toMatchObject({ status: "confirmed", value: "3b" });
    expect(extraction.egfr).toMatchObject({ status: "confirmed", value: 27.2 });
    expect(extraction.egfrUnit).toMatchObject({ status: "confirmed", value: "mL/min/1.73m2" });
    expect(extraction.onIvFluids).toMatchObject({ status: "confirmed", value: true });
    expect(extraction.dialysis).toMatchObject({ status: "confirmed", value: false });
  });

  it("recognises medicines from controlled dictionaries and respects explicit medication negation", () => {
    const extraction = extractClinicalNote(
      "The patient is taking ramipril and spironolactone. Ibuprofen was discontinued. Not taking losartan.",
    );

    expect(extraction.raasAntagonistUse).toMatchObject({ status: "conflicting", value: null });
    expect(extraction.recognisedMedicines).toMatchObject({ status: "confirmed" });
    expect(extraction.recognisedMedicines.values).toEqual(
      expect.arrayContaining([
        { category: "raas-antagonist", name: "ACE inhibitor", negated: false },
        { category: "raas-antagonist", name: "ARB", negated: true },
        {
          category: "hyperkalaemia-promoting",
          name: "mineralocorticoid receptor antagonist",
          negated: false,
        },
        { category: "hyperkalaemia-promoting", name: "NSAID", negated: true },
      ]),
    );
    expect(extraction.conflicts).toContainEqual(
      expect.objectContaining({ field: "raasAntagonistUse" }),
    );
  });

  it("marks contradictory values and electrolytes as conflicting instead of selecting one", () => {
    const extraction = extractClinicalNote(
      "Sodium is 126 mmol/L. Sodium is 130 mmol/L. Potassium is 6.1 mmol/L.",
    );

    expect(extraction.electrolyte).toMatchObject({ status: "conflicting", value: null });
    expect(extraction.value).toMatchObject({ status: "conflicting", value: null });
    expect(extraction.conflicts.map((conflict) => conflict.field)).toEqual(
      expect.arrayContaining(["electrolyte", "value"]),
    );
  });

  it("marks unsupported units as uncertain and leaves absent data missing", () => {
    const extraction = extractClinicalNote("Sodium is 125 mEq/L.");

    expect(extraction.value).toMatchObject({ status: "confirmed", value: 125 });
    expect(extraction.unit).toMatchObject({ status: "uncertain", value: null });
    expect(extraction.ckdStage).toMatchObject({ status: "missing", value: null });
    expect(extraction.onIvFluids).toMatchObject({ status: "missing", value: null });
    expect(extraction.dialysis).toMatchObject({ status: "missing", value: null });
  });

  it("extracts explicit saline and dialysis statements without treating them as a rule result", () => {
    const extraction = extractClinicalNote(
      "Receiving IV fluids containing 0.9% sodium chloride. The patient is not on dialysis.",
    );

    expect(extraction.onIvFluids).toMatchObject({ status: "confirmed", value: true });
    expect(extraction.ivFluidContainsSaline).toMatchObject({ status: "confirmed", value: true });
    expect(extraction.dialysis).toMatchObject({ status: "confirmed", value: false });
  });

  it("parses a representative validation-split synthetic note without reading the held-out test split", async () => {
    const cases = parseCsvRecords(
      await readFile(
        resolve(process.cwd(), "project-input", "nice_electrolyte_synthetic_cases.csv"),
        "utf8",
      ),
    );
    const syntheticCase = cases.find((entry) => entry.case_id === "CASE-0290");

    expect(syntheticCase?.data_split).toBe("validation");

    const extraction = extractClinicalNote(syntheticCase?.note_text ?? "");

    expect(extraction.electrolyte).toMatchObject({ status: "confirmed", value: "potassium" });
    expect(extraction.value).toMatchObject({ status: "confirmed", value: 2.08 });
    expect(extraction.onIvFluids).toMatchObject({ status: "confirmed", value: true });
    expect(extraction.dialysis).toMatchObject({ status: "confirmed", value: false });
  });
});
