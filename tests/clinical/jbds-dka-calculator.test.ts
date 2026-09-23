import {
  emptyJbdsDkaInput,
  evaluateJbdsDka,
  type JbdsDkaInput,
  type JbdsStageId,
} from "@/src/clinical/pathways/dka/jbds-calculator";
import { describe, expect, it } from "vitest";

const complete: JbdsDkaInput = {
  ...emptyJbdsDkaInput,
  ageYears: 45,
  knownDiabetes: true,
  diagnosticGlucose: 22,
  diagnosticKetones: 4,
  diagnosticPh: 7.2,
  diagnosticBicarbonate: 12,
  weightKg: 70,
  systolicBp: 110,
  potassium: 4.5,
  ivAccess: true,
  fluidsStarted: true,
  pregnant: false,
  heartFailure: false,
  kidneyFailure: false,
  elderly: false,
  currentGlucose: 12,
  previousKetones: 1.2,
  currentKetones: 0.4,
  intervalMinutes: 60,
  currentPh: 7.35,
  eatingAndDrinking: true,
  scPlanConfirmed: true,
  scShortActingGiven: true,
  overlapMinutes: 45,
};

function result(input: Partial<JbdsDkaInput> = {}) {
  return evaluateJbdsDka({ ...complete, ...input });
}

function stage(input: Partial<JbdsDkaInput>, id: JbdsStageId) {
  return result(input).stages.find((item) => item.id === id)!;
}

describe("current JBDS 02 DKA calculator", () => {
  it("runs a connected case from diagnosis through transition", () => {
    const evaluation = result();
    expect(evaluation.valid).toBe(true);
    expect(evaluation.diagnosis).toBe(true);
    expect(evaluation.stages).toHaveLength(6);
    expect(evaluation.initialInsulinUnitsPerHour).toBe(7);
    expect(evaluation.reducedInsulinUnitsPerHour).toBe(3.5);
    expect(evaluation.ketoneFallPerHour).toBe(0.8);
    expect(evaluation.resolved).toBe(true);
    expect(stage({}, "transition").status).toBe("complete");
  });

  it("uses strict diagnosis boundaries and the known-diabetes and urine alternatives", () => {
    expect(result({ knownDiabetes: false, diagnosticGlucose: 11 }).diagnosis).toBe(false);
    expect(result({ diagnosticGlucose: 11, knownDiabetes: true }).diagnosis).toBe(true);
    expect(result({ diagnosticGlucose: 9, knownDiabetes: true }).diagnosis).toBe(true);
    expect(result({ diagnosticKetones: 3, urineKetonesPlus: 1 }).diagnosis).toBe(false);
    expect(result({ diagnosticKetones: 3, urineKetonesPlus: 2 }).diagnosis).toBe(true);
    expect(result({ diagnosticPh: 7.3, diagnosticBicarbonate: 15 }).diagnosis).toBe(false);
    expect(result({ diagnosticPh: 7.3, diagnosticBicarbonate: 14.9 }).diagnosis).toBe(true);
    expect(result({ diagnosticPh: 7.29, diagnosticBicarbonate: 15 }).diagnosis).toBe(true);
    expect(result({ knownDiabetes: null, diagnosticGlucose: null }).diagnosis).toBe(null);
    expect(result({ ageYears: 17, adultTeamFor16To17: null }).diagnosis).toBe(null);
    expect(result({ ageYears: 17, adultTeamFor16To17: true }).diagnosis).toBe(true);
    expect(result({ ageYears: 15 }).diagnosis).toBe(false);
  });

  it("branches on blood pressure without inferring the unaddressed post-bolus 90 boundary", () => {
    expect(stage({ systolicBp: 90 }, "fluids").details.join(" ")).toContain("first 60 minutes");
    expect(stage({ systolicBp: 89, repeatSystolicBp: null }, "fluids").status).toBe("needs-input");
    expect(stage({ systolicBp: 89, repeatSystolicBp: 89 }, "fluids").status).toBe("review");
    expect(stage({ systolicBp: 89, repeatSystolicBp: 90 }, "fluids").summary).toContain(
      "exactly 90",
    );
    expect(stage({ systolicBp: 89, repeatSystolicBp: 91 }, "fluids").details.join(" ")).toContain(
      "next 60 minutes",
    );
    expect(stage({ ivAccess: false }, "fluids").summary).toContain("critical care");
  });

  it("applies potassium and weight rules without silently capping or starting unsafe insulin", () => {
    expect(stage({ potassium: 3.49 }, "fluids").status).toBe("review");
    expect(stage({ potassium: 3.49 }, "insulin").status).toBe("review");
    expect(stage({ potassium: 3.5 }, "fluids").details.join(" ")).toContain("40 mmol");
    expect(stage({ potassium: 5.5 }, "fluids").details.join(" ")).toContain("40 mmol");
    expect(stage({ potassium: 5.51 }, "fluids").details.join(" ")).toContain("no potassium");
    expect(result({ weightKg: 160 }).initialInsulinUnitsPerHour).toBe(16);
    expect(stage({ weightKg: 160 }, "insulin").status).toBe("review");
    expect(stage({ fluidsStarted: false }, "insulin").status).toBe("review");
  });

  it("adds glucose support below 14 and does not automatically reduce the insulin rate", () => {
    expect(stage({ currentGlucose: 13.9 }, "insulin").details.join(" ")).toContain(
      "10% glucose at 125 mL/hour",
    );
    expect(stage({ currentGlucose: 14 }, "insulin").details.join(" ")).not.toContain(
      "10% glucose at 125 mL/hour",
    );
    expect(stage({ currentGlucose: 13.9 }, "insulin").details.join(" ")).toContain(
      "consider reducing",
    );
  });

  it("uses ketone trend first and the paired fallback only when ketones are absent", () => {
    expect(result({ currentKetones: 0.7 }).ketoneFallPerHour).toBe(0.5);
    expect(stage({ currentKetones: 0.7 }, "monitoring").status).toBe("complete");
    expect(stage({ currentKetones: 0.7 }, "monitoring").details.join(" ")).toContain(
      "Ketones fell by 0.5 mmol/L/hour",
    );
    expect(stage({ currentKetones: 0.8 }, "monitoring").status).toBe("review");
    expect(stage({ previousKetones: 1.2, currentKetones: 0.704 }, "monitoring").status).toBe(
      "review",
    );
    expect(stage({ currentKetones: 0.8 }, "monitoring").details.join(" ")).toContain("pump");
    const increasingKetones = stage(
      { previousKetones: 1.2, currentKetones: 3, intervalMinutes: 60 },
      "monitoring",
    ).details.join(" ");
    expect(increasingKetones).toContain("Ketones increased by 1.8 mmol/L/hour");
    expect(increasingKetones).not.toContain("Ketones fell by -1.8");
    expect(increasingKetones).toContain("increase the insulin infusion rate by 1 unit/hour");
    expect(increasingKetones).not.toContain("No automatic dose increase is generated");
    expect(
      stage({ previousKetones: 1.2, currentKetones: 1.2 }, "monitoring").details.join(" "),
    ).toContain("Ketones were unchanged");
    expect(
      stage(
        {
          previousKetones: null,
          currentKetones: null,
          previousBicarbonate: 10,
          currentBicarbonate: 13,
          previousGlucose: 20,
          currentGlucose: 17,
        },
        "monitoring",
      ).status,
    ).toBe("complete");
    expect(
      stage(
        {
          previousKetones: null,
          currentKetones: null,
          previousBicarbonate: 10,
          currentBicarbonate: 12.9,
          previousGlucose: 20,
          currentGlucose: 17,
        },
        "monitoring",
      ).status,
    ).toBe("review");
    expect(
      stage(
        {
          previousKetones: 1,
          currentKetones: null,
          previousBicarbonate: 10,
          currentBicarbonate: 13,
          previousGlucose: 20,
          currentGlucose: 17,
        },
        "monitoring",
      ).status,
    ).toBe("needs-input");
  });

  it("derives the urine-output target and retains earlier review concerns at transition", () => {
    expect(stage({ urineOutputMlPerHour: 34 }, "monitoring").status).toBe("review");
    expect(stage({ urineOutputMlPerHour: 35 }, "monitoring").status).toBe("complete");
    expect(stage({ pregnant: true }, "transition").status).toBe("review");
    expect(stage({ ivAccess: false, potassium: null }, "fluids").status).toBe("review");
  });

  it("requires both strict resolution measurements and a minimum 30-minute overlap", () => {
    expect(result({ currentKetones: 0.6 }).resolved).toBe(false);
    expect(result({ currentPh: 7.3 }).resolved).toBe(false);
    expect(result({ currentKetones: 0.59, currentPh: 7.31 }).resolved).toBe(true);
    expect(result({ currentKetones: null }).resolved).toBe(null);
    expect(stage({ eatingAndDrinking: false }, "transition").summary).toContain("VRIII");
    expect(stage({ scPlanConfirmed: false }, "transition").status).toBe("needs-input");
    expect(stage({ overlapMinutes: 29 }, "transition").status).toBe("review");
    expect(stage({ overlapMinutes: 30 }, "transition").status).toBe("complete");
  });

  it("rejects implausible or impossible measurements without downstream output", () => {
    const invalid = result({ diagnosticPh: 15, weightKg: -2, intervalMinutes: 0 });
    expect(invalid.valid).toBe(false);
    expect(invalid.issues.map((issue) => issue.path)).toEqual(
      expect.arrayContaining(["diagnosticPh", "weightKg", "intervalMinutes"]),
    );
    expect(invalid.initialInsulinUnitsPerHour).toBe(null);
    expect(invalid.stages.every((item) => item.status === "needs-input")).toBe(true);
  });
});
