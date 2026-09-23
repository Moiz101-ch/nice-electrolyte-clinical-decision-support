import { describe, expect, it } from "vitest";

import {
  DKA_SOURCE_ID,
  dkaLaterSyntheticCases,
  evaluateDkaStepsFiveToTen,
  type DkaStepsFiveToTenInput,
} from "@/src/clinical/pathways/dka";

const base = dkaLaterSyntheticCases[0]!.input;

function evaluate(changes: Partial<DkaStepsFiveToTenInput> = {}) {
  return evaluateDkaStepsFiveToTen({ ...base, ...changes });
}

describe("DKA Steps 5-10 technical preview", () => {
  it("connects to the first four stages, audits oliguria, and stops at the resolution conflict", () => {
    const result = evaluate();

    expect(result.activeClinicalOutput).toBe(false);
    expect(result.stages.map(({ status }) => status)).toEqual([
      "complete",
      "complete",
      "complete",
      "complete",
      "requires-review",
      "not-reached",
    ]);
    expect(result.oliguriaThreshold?.output.value).toBe(36);
    expect(result.oliguriaThreshold?.formula).toBe("weight in kg x 0.5 mL/kg/hour");
    expect(result.oliguriaThreshold?.operands[0]).toEqual({
      key: "dka.weightKg",
      kind: "numeric-input",
      unit: "kg",
      value: 72,
    });
    expect(result.responseTrend).toEqual({
      bicarbonateRiseMmolLPerHour: 1,
      glucoseFallMmolLPerHour: 5,
      ketoneFallMmolLPerHour: 0.7,
      sourceTargetsMet: true,
    });
    expect(result.stages[4].sourceReferences.map(({ page }) => page)).toEqual([2, 3]);
    expect(
      result.stages[4].sourceReferences.every(({ sourceId }) => sourceId === DKA_SOURCE_ID),
    ).toBe(true);
    expect(result.transitionReview.status).toBe("mapped-for-review");
    expect(result.stages[5].findings.join(" ")).toMatch(/connected pathway stops/i);
  });

  it("does not enter Step 5 if the source-defined initial stages are incomplete", () => {
    const result = evaluate({
      initial: { ...base.initial, bloodGlucoseMmolL: 11 },
    });

    expect(result.stages[0].status).toBe("not-reached");
    expect(result.stages.slice(1).every(({ status }) => status === "not-reached")).toBe(true);
    expect(result.oliguriaThreshold).toBeNull();
  });

  it("escalates each strict source-listed Step 5 threshold", () => {
    const changes: Partial<DkaStepsFiveToTenInput["further"]>[] = [
      { bloodKetonesMmolL: 6.1 },
      { bicarbonateMmolL: 4.9 },
      { ph: 7.09 },
      { admissionPotassiumMmolL: 3.4 },
      { gcs: 11 },
      { oxygenSaturationPercent: 91 },
      { systolicBpMmhg: 89 },
      { pulseBpm: 101 },
      { pulseBpm: 59 },
    ];

    for (const change of changes) {
      const result = evaluate({ further: { ...base.further, ...change } });
      expect(result.stages[0].status).toBe("requires-review");
      expect(result.stages[0].findings.join(" ")).toMatch(/critical-care review/i);
      expect(result.stages[1].status).toBe("not-reached");
    }

    expect(evaluate({ further: { ...base.further, bloodKetonesMmolL: 6 } }).stages[0].status).toBe(
      "complete",
    );
    expect(evaluate({ further: { ...base.further, bicarbonateMmolL: 5 } }).stages[0].status).toBe(
      "complete",
    );
    expect(evaluate({ further: { ...base.further, ph: 7.1 } }).stages[0].status).toBe("complete");
    expect(
      evaluate({ further: { ...base.further, admissionPotassiumMmolL: 3.5 } }).stages[0].status,
    ).toBe("complete");
    expect(evaluate({ further: { ...base.further, gcs: 12 } }).stages[0].status).toBe("complete");
    expect(
      evaluate({ further: { ...base.further, oxygenSaturationPercent: 92 } }).stages[0].status,
    ).toBe("complete");
    expect(evaluate({ further: { ...base.further, systolicBpMmhg: 90 } }).stages[0].status).toBe(
      "complete",
    );
    expect(evaluate({ further: { ...base.further, pulseBpm: 100 } }).stages[0].status).toBe(
      "complete",
    );
    expect(evaluate({ further: { ...base.further, pulseBpm: 60 } }).stages[0].status).toBe(
      "complete",
    );
  });

  it("does not infer a respiratory-baseline criterion or missing measurements", () => {
    const unknownBaseline = evaluate({
      further: {
        ...base.further,
        normalBaselineRespiratoryFunction: null,
        oxygenSaturationPercent: 91,
      },
    });
    expect(unknownBaseline.stages[0].status).toBe("requires-review");
    expect(unknownBaseline.stages[0].summary).toMatch(/cannot be excluded/i);

    const missingPulse = evaluate({ further: { ...base.further, pulseBpm: null } });
    expect(missingPulse.stages[0].status).toBe("requires-review");
    expect(missingPulse.stages[1].status).toBe("not-reached");
  });

  it("halts standard fluid sequencing for source caution contexts or missing setup", () => {
    for (const fluidChange of [
      { elderlyClinicallyConfirmed: true },
      { pregnant: true },
      { heartFailure: true },
      { renalFailure: true },
    ]) {
      const result = evaluate({ fluid: { ...base.fluid, ...fluidChange } });
      expect(result.stages[1].status).toBe("requires-review");
      expect(result.stages[2].status).toBe("not-reached");
    }

    const youngAdult = evaluate({ initial: { ...base.initial, ageYears: 25 } });
    expect(youngAdult.stages[1].status).toBe("requires-review");
    expect(evaluate({ initial: { ...base.initial, ageYears: 26 } }).stages[1].status).toBe(
      "complete",
    );
    expect(
      evaluate({ fluid: { ...base.fluid, fluidChartCompleted: false } }).stages[1].status,
    ).toBe("requires-review");
  });

  it("uses exact potassium and glucose monitoring bands", () => {
    const low = evaluate({ monitoring: { ...base.monitoring, potassiumMmolL: 3.4 } });
    expect(low.stages[2].status).toBe("requires-review");
    expect(low.stages[3].status).toBe("not-reached");

    for (const potassium of [3.5, 5.5]) {
      const result = evaluate({ monitoring: { ...base.monitoring, potassiumMmolL: potassium } });
      expect(result.stages[2].status).toBe("complete");
      expect(result.stages[2].findings.join(" ")).toMatch(/20 mmol potassium chloride/i);
    }

    const high = evaluate({ monitoring: { ...base.monitoring, potassiumMmolL: 5.6 } });
    expect(high.stages[2].findings.join(" ")).toMatch(/no added potassium/i);
    expect(
      evaluate({
        monitoring: { ...base.monitoring, bloodGlucoseMmolL: 13.9 },
      }).stages[2].findings.join(" "),
    ).toMatch(/125 mL\/hour/i);
    expect(
      evaluate({
        monitoring: { ...base.monitoring, bloodGlucoseMmolL: 14 },
      }).stages[2].findings.join(" "),
    ).toMatch(/not below/i);
  });

  it("treats urine output below, but not equal to, the calculated threshold as oliguria", () => {
    const below = evaluate({ monitoring: { ...base.monitoring, urineOutputMlPerHour: 35.9 } });
    expect(below.oliguriaThreshold?.output.value).toBe(36);
    expect(below.stages[2].findings.join(" ")).toMatch(/consider catheterisation/i);

    const boundary = evaluate({ monitoring: { ...base.monitoring, urineOutputMlPerHour: 36 } });
    expect(boundary.stages[2].findings.join(" ")).toMatch(/not below/i);
    const incontinent = evaluate({ monitoring: { ...base.monitoring, incontinent: true } });
    expect(incontinent.stages[2].findings.join(" ")).toMatch(/consider catheterisation/i);
  });

  it("flags low oxygen and airway concerns without silently advancing", () => {
    const lowOxygen = evaluate({ monitoring: { ...base.monitoring, oxygenSaturationPercent: 91 } });
    expect(lowOxygen.stages[2].findings.join(" ")).toMatch(/arterial rather than venous/i);

    const vomiting = evaluate({ monitoring: { ...base.monitoring, persistentVomiting: true } });
    expect(vomiting.stages[2].status).toBe("requires-review");
    expect(vomiting.stages[3].status).toBe("not-reached");
    expect(vomiting.stages[2].findings.join(" ")).toMatch(/airway protection/i);
  });

  it("applies the one-hour OR/AND response target at exact boundaries", () => {
    const ketoneTarget = evaluate({
      response: {
        ...base.response,
        currentBloodKetonesMmolL: 3.7,
        currentBloodGlucoseMmolL: 15,
      },
    });
    expect(ketoneTarget.responseTrend?.ketoneFallMmolLPerHour).toBe(0.5);
    expect(ketoneTarget.responseTrend?.sourceTargetsMet).toBe(true);

    const bicarbonateTarget = evaluate({
      response: {
        ...base.response,
        currentBicarbonateMmolL: 15,
        currentBloodKetonesMmolL: 4,
        currentBloodGlucoseMmolL: 15,
      },
    });
    expect(bicarbonateTarget.responseTrend?.sourceTargetsMet).toBe(true);

    const glucoseTooSlow = evaluate({
      response: { ...base.response, currentBloodGlucoseMmolL: 15.1 },
    });
    expect(glucoseTooSlow.responseTrend?.sourceTargetsMet).toBe(false);
    expect(glucoseTooSlow.stages[3].status).toBe("requires-review");
    expect(glucoseTooSlow.stages[4].status).toBe("not-reached");

    const wrongInterval = evaluate({ response: { ...base.response, intervalMinutes: 90 } });
    expect(wrongInterval.responseTrend).toBeNull();
    expect(wrongInterval.stages[3].status).toBe("requires-review");
  });

  it("never infers DKA resolution from either source's conflicting wording", () => {
    for (const resolution of [
      { bloodKetonesMmolL: 0.5, venousPh: 7.4, bicarbonateMmolL: 19 },
      { bloodKetonesMmolL: 0.7, venousPh: 7.2, bicarbonateMmolL: 17 },
    ]) {
      const result = evaluate({ resolution });
      expect(result.stages[4].status).toBe("requires-review");
      expect(result.stages[5].status).toBe("not-reached");
      expect(result.activeClinicalOutput).toBe(false);
    }
  });

  it("maps each conversion context only as non-executable review material", () => {
    const branches = [
      ["new", /specialist diabetes team/i],
      ["basal-bolus", /30 minutes/i],
      ["twice-daily-mixed", /breakfast or the evening meal/i],
      ["pump", /not recommence at bedtime/i],
    ] as const;

    for (const [regimen, expected] of branches) {
      const result = evaluate({ conversion: { ...base.conversion, regimen } });
      expect(result.transitionReview.status).toBe("mapped-for-review");
      expect(result.transitionReview.findings.join(" ")).toMatch(expected);
      expect(result.stages[5].status).toBe("not-reached");
    }

    expect(
      evaluate({ conversion: { ...base.conversion, eating: false } }).transitionReview.status,
    ).toBe("not-ready");
    expect(
      evaluate({ conversion: { ...base.conversion, regimen: null } }).transitionReview.status,
    ).toBe("context-missing");
  });

  it("fails closed on malformed synthetic data", () => {
    const malformed = evaluate({ monitoring: { ...base.monitoring, potassiumMmolL: Number.NaN } });
    expect(malformed.stages[0].status).toBe("requires-review");
    expect(malformed.inputIssues).not.toHaveLength(0);
    expect(malformed.oliguriaThreshold).toBeNull();

    const extraField = evaluateDkaStepsFiveToTen({ ...base, inventedDose: 42 });
    expect(extraField.inputIssues).not.toHaveLength(0);
    expect(extraField.activeClinicalOutput).toBe(false);
  });
});
