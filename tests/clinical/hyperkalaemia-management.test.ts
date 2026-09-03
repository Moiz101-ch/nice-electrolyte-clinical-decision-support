import { describe, expect, it } from "vitest";

import {
  DIGOXIN_TOXICITY_INPUT_KEY,
  HYPERKALAEMIA_SOURCE_ID,
  HYPERKALAEMIA_UKKA_SOURCE_ID,
  PRETREATMENT_GLUCOSE_INPUT_KEY,
  SALBUTAMOL_CONTEXT_INPUT_KEY,
  evaluateHyperkalaemiaTimedManagement,
  hyperkalaemiaTimedManagementPathwayDefinition,
  type DigoxinToxicityConcern,
  type HyperkalaemiaEcgChange,
  type SalbutamolContext,
} from "@/src/clinical/pathways/hyperkalaemia";

const completedSevereInput = {
  digoxinToxicityConcern: "not-confirmed" as const,
  ecgChanges: ["peaked-t-waves"] as HyperkalaemiaEcgChange[],
  potassium: 6.5,
  pretreatmentBloodGlucose: 7,
  salbutamolContext: "no-listed-caution" as const,
};

describe("Hyperkalaemia timed management", () => {
  it("provides a source-traceable review-gated v0.3.0 definition", () => {
    expect(hyperkalaemiaTimedManagementPathwayDefinition).toMatchObject({
      pathwayId: "hyperkalaemia-timed-management",
      sourceIds: [HYPERKALAEMIA_SOURCE_ID, HYPERKALAEMIA_UKKA_SOURCE_ID],
      status: "awaiting-clinical-review",
      version: "0.3.0",
    });
    expect(hyperkalaemiaTimedManagementPathwayDefinition.reviewMetadata.approvedBy).toBeNull();
  });

  it("routes mild Hyperkalaemia to daily monitoring and cause prevention without acute drugs", () => {
    const snapshot = evaluateHyperkalaemiaTimedManagement({
      digoxinToxicityConcern: "confirmed",
      ecgChanges: ["peaked-t-waves"],
      potassium: 5.9,
      pretreatmentBloodGlucose: 3,
      salbutamolContext: "no-listed-caution",
    });

    expect(snapshot.status).toBe("requires-clinical-review");
    expect(snapshot.monitoring).toContainEqual(
      expect.objectContaining({ monitoringId: "mild-daily-potassium" }),
    );
    expect(snapshot.nextActions).toContainEqual(
      expect.objectContaining({ actionId: "review-medication-and-diet" }),
    );
    expect(snapshot.nextActions).not.toContainEqual(
      expect.objectContaining({ actionId: "insulin-glucose-infusion" }),
    );
    expect(snapshot.confirmedInputs).not.toHaveProperty(DIGOXIN_TOXICITY_INPUT_KEY);
    expect(snapshot.confirmedInputs).not.toHaveProperty(PRETREATMENT_GLUCOSE_INPUT_KEY);
    expect(snapshot.confirmedInputs).not.toHaveProperty(SALBUTAMOL_CONTEXT_INPUT_KEY);
  });

  it("keeps the connected ECG question as the next step from 6.0 mmol/L", () => {
    const snapshot = evaluateHyperkalaemiaTimedManagement({ potassium: 6 });

    expect(snapshot).toMatchObject({ status: "awaiting-input" });
    expect(snapshot.currentNode?.id).toBe("ecg-changes-question");
  });

  it("does not infer acute drug treatment for moderate Hyperkalaemia without ECG changes", () => {
    const snapshot = evaluateHyperkalaemiaTimedManagement({
      ecgChanges: ["none-confirmed"],
      potassium: 6.4,
    });

    expect(snapshot.status).toBe("requires-clinical-review");
    expect(snapshot.warnings).toContainEqual(
      expect.objectContaining({ warningId: "moderate-treatment-selection-unresolved" }),
    );
    expect(snapshot.monitoring).toContainEqual(
      expect.objectContaining({ monitoringId: "moderate-potassium-monitoring" }),
    );
    expect(snapshot.nextActions).not.toContainEqual(
      expect.objectContaining({ actionId: "insulin-glucose-infusion" }),
    );
  });

  it("requests the digoxin-toxicity context when a listed ECG change is confirmed", () => {
    const snapshot = evaluateHyperkalaemiaTimedManagement({
      ecgChanges: ["broad-qrs"],
      potassium: 6,
    });

    expect(snapshot.currentNode?.id).toBe("ecg-changes-confirmed-review");
    expect(snapshot.status).toBe("awaiting-input");
    expect(snapshot.escalations).toContainEqual(
      expect.objectContaining({ escalationId: "cardiac-monitoring-resuscitation" }),
    );
  });

  it.each([
    ["not-confirmed", "calcium-gluconate-standard"],
    ["confirmed", "calcium-gluconate-digoxin-consideration"],
  ] as const)("selects the %s calcium branch without duplicating doses", (context, actionId) => {
    const snapshot = evaluateHyperkalaemiaTimedManagement({
      digoxinToxicityConcern: context,
      ecgChanges: ["sine-wave"],
      potassium: 6.5,
    });

    expect(snapshot.currentNode?.id).toBe("pretreatment-glucose-input");
    expect(snapshot.immediateActions).toContainEqual(expect.objectContaining({ actionId }));
    expect(
      snapshot.immediateActions.filter((action) => action.actionId.startsWith("calcium-gluconate")),
    ).toHaveLength(1);
  });

  it("does not choose a calcium administration duration when digoxin context is uncertain", () => {
    const snapshot = evaluateHyperkalaemiaTimedManagement({
      digoxinToxicityConcern: "unable-to-determine",
      ecgChanges: ["ventricular-tachycardia"],
      potassium: 6.5,
    });

    expect(snapshot.currentNode?.id).toBe("pretreatment-glucose-input");
    expect(snapshot.warnings).toContainEqual(
      expect.objectContaining({ warningId: "calcium-duration-not-selected" }),
    );
    expect(snapshot.immediateActions).not.toContainEqual(
      expect.objectContaining({ actionId: expect.stringMatching(/^calcium-gluconate/) }),
    );
  });

  it("continues severe intracellular-shift treatment when ECG assessment is uncertain", () => {
    const snapshot = evaluateHyperkalaemiaTimedManagement({
      ecgChanges: ["unable-to-determine"],
      potassium: 6.5,
    });

    expect(snapshot.currentNode?.id).toBe("pretreatment-glucose-input");
    expect(snapshot.warnings).toContainEqual(
      expect.objectContaining({ warningId: "severe-ecg-uncertain" }),
    );
    expect(snapshot.immediateActions).not.toContainEqual(
      expect.objectContaining({ actionId: expect.stringMatching(/^calcium-gluconate/) }),
    );
  });

  it("keeps moderate ECG uncertainty on a non-drug review branch", () => {
    const snapshot = evaluateHyperkalaemiaTimedManagement({
      ecgChanges: ["unable-to-determine"],
      potassium: 6.4,
    });

    expect(snapshot.status).toBe("requires-clinical-review");
    expect(snapshot.warnings).toContainEqual(
      expect.objectContaining({ warningId: "moderate-ecg-uncertain" }),
    );
    expect(snapshot.nextActions).not.toContainEqual(
      expect.objectContaining({ actionId: "insulin-glucose-infusion" }),
    );
  });

  it("requires urgent calcium context at 7.0 mmol/L when ECG cannot be determined", () => {
    const snapshot = evaluateHyperkalaemiaTimedManagement({
      ecgChanges: ["unable-to-determine"],
      potassium: 7,
    });

    expect(snapshot.currentNode?.id).toBe("seven-plus-digoxin-context");
    expect(snapshot.warnings).toContainEqual(
      expect.objectContaining({ warningId: "do-not-delay-calcium-for-ecg" }),
    );
  });

  it.each([
    [0, true],
    [6.99, true],
    [7, false],
  ])("applies the pre-treatment glucose boundary at %s mmol/L", (glucose, needsFollowOn) => {
    const snapshot = evaluateHyperkalaemiaTimedManagement({
      digoxinToxicityConcern: "not-confirmed",
      ecgChanges: ["peaked-t-waves"],
      potassium: 6.5,
      pretreatmentBloodGlucose: glucose,
    });
    const hasFollowOn = snapshot.nextActions.some(
      ({ actionId }) => actionId === "low-baseline-glucose-follow-on",
    );

    expect(snapshot.currentNode?.id).toBe("salbutamol-context-question");
    expect(snapshot.nextActions).toContainEqual(
      expect.objectContaining({ actionId: "insulin-glucose-infusion" }),
    );
    expect(hasFollowOn).toBe(needsFollowOn);
  });

  it("blocks invalid pre-treatment glucose values and units", () => {
    expect(
      evaluateHyperkalaemiaTimedManagement({
        digoxinToxicityConcern: "not-confirmed",
        ecgChanges: ["peaked-t-waves"],
        potassium: 6.5,
        pretreatmentBloodGlucose: -0.01,
      }),
    ).toMatchObject({ blockReason: "invalid-input", status: "blocked" });
    expect(
      evaluateHyperkalaemiaTimedManagement({
        digoxinToxicityConcern: "not-confirmed",
        ecgChanges: ["peaked-t-waves"],
        potassium: 6.5,
        pretreatmentBloodGlucose: 6,
        pretreatmentBloodGlucoseUnit: "mg/dL",
      }),
    ).toMatchObject({ blockReason: "invalid-input", status: "blocked" });
    expect(
      evaluateHyperkalaemiaTimedManagement({
        digoxinToxicityConcern: "not-confirmed",
        ecgChanges: ["peaked-t-waves"],
        potassium: 6.5,
        pretreatmentBloodGlucose: 6.999,
      }),
    ).toMatchObject({ blockReason: "invalid-input", status: "blocked" });
  });

  it.each([
    ["tachycardia", "avoid-salbutamol-tachycardia", null],
    ["ischaemic-heart-disease", null, "salbutamol-ihd-consideration"],
    ["no-listed-caution", null, "salbutamol-standard-consideration"],
    ["unable-to-determine", "salbutamol-context-uncertain", null],
  ] as const)(
    "handles salbutamol context %s without inferring a contraindicated instruction",
    (salbutamolContext, warningId, actionId) => {
      const snapshot = evaluateHyperkalaemiaTimedManagement({
        ...completedSevereInput,
        salbutamolContext,
      });

      expect(snapshot.status).toBe("requires-clinical-review");
      if (warningId) {
        expect(snapshot.warnings).toContainEqual(expect.objectContaining({ warningId }));
      }
      if (actionId) {
        expect(snapshot.nextActions).toContainEqual(expect.objectContaining({ actionId }));
      } else {
        expect(snapshot.nextActions).not.toContainEqual(
          expect.objectContaining({ actionId: expect.stringMatching(/^salbutamol/) }),
        );
      }
    },
  );

  it("records the sodium-zirconium conflict and emits no automated regimen", () => {
    const snapshot = evaluateHyperkalaemiaTimedManagement(completedSevereInput);

    expect(snapshot.warnings).toContainEqual(
      expect.objectContaining({ warningId: "sodium-zirconium-source-conflict" }),
    );
    expect(
      [...snapshot.immediateActions, ...snapshot.nextActions].some(({ actionId }) =>
        actionId.includes("zirconium"),
      ),
    ).toBe(false);
    expect(snapshot.sourceReferences).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ page: 1, sourceId: HYPERKALAEMIA_SOURCE_ID }),
        expect.objectContaining({ page: 2, sourceId: HYPERKALAEMIA_SOURCE_ID }),
      ]),
    );
  });

  it("adds severe treatment monitoring, relevant escalation and prevention actions", () => {
    const snapshot = evaluateHyperkalaemiaTimedManagement(completedSevereInput);

    expect(snapshot.monitoring).toEqual([
      expect.objectContaining({ monitoringId: "severe-potassium-monitoring" }),
      expect.objectContaining({ monitoringId: "severe-insulin-glucose-monitoring" }),
    ]);
    expect(snapshot.escalations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ escalationId: "dialysis-transplant-renal-discussion" }),
        expect.objectContaining({ escalationId: "refractory-or-renal-impairment-discussion" }),
      ]),
    );
    expect(snapshot.nextActions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ actionId: "sodium-bicarbonate-conditional" }),
        expect.objectContaining({ actionId: "furosemide-conditional" }),
        expect.objectContaining({ actionId: "dialysis-conditional" }),
        expect.objectContaining({ actionId: "consider-underlying-hyperkalaemia-causes" }),
        expect.objectContaining({ actionId: "review-medication-and-diet" }),
      ]),
    );
  });

  it("blocks contradictory ECG answers and undeclared management values", () => {
    expect(
      evaluateHyperkalaemiaTimedManagement({
        ecgChanges: ["peaked-t-waves", "none-confirmed"],
        potassium: 6.5,
      }),
    ).toMatchObject({ blockReason: "ambiguous-branch", status: "blocked" });
    expect(
      evaluateHyperkalaemiaTimedManagement({
        digoxinToxicityConcern: "unknown" as DigoxinToxicityConcern,
        ecgChanges: ["peaked-t-waves"],
        potassium: 6.5,
      }),
    ).toMatchObject({ blockReason: "invalid-input", status: "blocked" });
    expect(
      evaluateHyperkalaemiaTimedManagement({
        ...completedSevereInput,
        salbutamolContext: "unknown" as SalbutamolContext,
      }),
    ).toMatchObject({ blockReason: "invalid-input", status: "blocked" });
  });

  it("returns deterministic immutable snapshots", () => {
    const first = evaluateHyperkalaemiaTimedManagement(completedSevereInput);
    const second = evaluateHyperkalaemiaTimedManagement(completedSevereInput);

    expect(first).toEqual(second);
    expect(Object.isFrozen(first)).toBe(true);
    expect(Object.isFrozen(first.monitoring)).toBe(true);
    expect(Object.isFrozen(first.nextActions)).toBe(true);
  });
});
