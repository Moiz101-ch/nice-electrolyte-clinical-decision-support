import { describe, expect, it } from "vitest";

import {
  ECG_CHANGES_INPUT_KEY,
  HYPERKALAEMIA_ECG_CHANGE_OPTIONS,
  HYPERKALAEMIA_SOURCE_ID,
  evaluateHyperkalaemiaEcgWorkflow,
  hyperkalaemiaEcgPathwayDefinition,
  type HyperkalaemiaEcgChange,
} from "@/src/clinical/pathways/hyperkalaemia";

describe("Hyperkalaemia ECG workflow", () => {
  it("extends the severity pathway with a source-traceable review-gated definition", () => {
    expect(hyperkalaemiaEcgPathwayDefinition).toMatchObject({
      pathwayId: "hyperkalaemia-ecg-assessment",
      sourceIds: [HYPERKALAEMIA_SOURCE_ID],
      status: "awaiting-clinical-review",
      version: "0.2.1",
    });
    expect(HYPERKALAEMIA_ECG_CHANGE_OPTIONS.map(({ label }) => label)).toEqual([
      "Peaked T waves",
      "Broad QRS",
      "Flat or absent P waves",
      "Bradycardia",
      "Ventricular tachycardia (VT)",
      "Sine wave",
    ]);
  });

  it("does not ask the ECG question for mild Hyperkalaemia or retain stale ECG input", () => {
    const snapshot = evaluateHyperkalaemiaEcgWorkflow({
      ecgChanges: ["peaked-t-waves"],
      potassium: 5.9,
    });

    expect(snapshot.currentNode?.id).toBe("mild-classification-review");
    expect(snapshot.status).toBe("requires-clinical-review");
    expect(snapshot.confirmedInputs).not.toHaveProperty(ECG_CHANGES_INPUT_KEY);
    expect(snapshot.escalations).toEqual([]);
    expect(snapshot.immediateActions).not.toContainEqual(
      expect.objectContaining({ actionId: "perform-ecg-monitor-rhythm" }),
    );
  });

  it.each([6, 6.4, 6.5, 6.99, 7])(
    "requests explicit ECG findings for potassium %s mmol/L",
    (potassium) => {
      const snapshot = evaluateHyperkalaemiaEcgWorkflow({ potassium });

      expect(snapshot.currentNode?.id).toBe("ecg-changes-question");
      expect(snapshot.status).toBe("awaiting-input");
      expect(snapshot.immediateActions).toContainEqual(
        expect.objectContaining({ actionId: "perform-ecg-monitor-rhythm" }),
      );
    },
  );

  it("preserves the 7.0 mmol/L safeguard while awaiting ECG confirmation", () => {
    const snapshot = evaluateHyperkalaemiaEcgWorkflow({ potassium: 7 });

    expect(snapshot.warnings).toContainEqual(
      expect.objectContaining({ warningId: "do-not-delay-calcium-for-ecg" }),
    );
    expect(snapshot.currentNode?.id).toBe("ecg-changes-question");
  });

  it.each(HYPERKALAEMIA_ECG_CHANGE_OPTIONS.map(({ value }) => value))(
    "routes the listed ECG change %s to the source escalation branch",
    (ecgChange) => {
      const snapshot = evaluateHyperkalaemiaEcgWorkflow({
        ecgChanges: [ecgChange],
        potassium: 6,
      });

      expect(snapshot.currentNode?.id).toBe("ecg-changes-confirmed-review");
      expect(snapshot.status).toBe("requires-clinical-review");
      expect(snapshot.escalations).toEqual([
        expect.objectContaining({
          escalationId: "cardiac-monitoring-resuscitation",
          urgency: "immediate",
        }),
        expect.objectContaining({
          escalationId: "consider-outreach-referral",
          urgency: "urgent",
        }),
      ]);
      expect(snapshot.sourceReferences).toContainEqual({
        page: 2,
        section: "Are ECG changes present?",
        sourceId: HYPERKALAEMIA_SOURCE_ID,
      });
    },
  );

  it("accepts multiple listed ECG changes without duplicating escalation", () => {
    const snapshot = evaluateHyperkalaemiaEcgWorkflow({
      ecgChanges: ["peaked-t-waves", "broad-qrs", "sine-wave"],
      potassium: 6.5,
    });

    expect(snapshot.currentNode?.id).toBe("ecg-changes-confirmed-review");
    expect(snapshot.escalations).toHaveLength(2);
  });

  it("records the explicit no-change branch without ECG escalation", () => {
    const snapshot = evaluateHyperkalaemiaEcgWorkflow({
      ecgChanges: ["none-confirmed"],
      potassium: 6,
    });

    expect(snapshot.currentNode?.id).toBe("no-ecg-changes-review");
    expect(snapshot.status).toBe("requires-clinical-review");
    expect(snapshot.escalations).toEqual([]);
  });

  it("fails closed when ECG findings cannot be determined safely", () => {
    const snapshot = evaluateHyperkalaemiaEcgWorkflow({
      ecgChanges: ["unable-to-determine"],
      potassium: 6.5,
    });

    expect(snapshot.currentNode?.id).toBe("ecg-assessment-uncertain-review");
    expect(snapshot.status).toBe("requires-clinical-review");
    expect(snapshot.escalations).toEqual([]);
  });

  it.each([
    ["peaked-t-waves", "none-confirmed"],
    ["broad-qrs", "unable-to-determine"],
    ["none-confirmed", "unable-to-determine"],
  ] as HyperkalaemiaEcgChange[][])(
    "blocks contradictory ECG selections %s and %s",
    (...ecgChanges) => {
      const snapshot = evaluateHyperkalaemiaEcgWorkflow({ ecgChanges, potassium: 6.5 });

      expect(snapshot).toMatchObject({ blockReason: "ambiguous-branch", status: "blocked" });
      expect(snapshot.escalations).toEqual([]);
    },
  );

  it("blocks empty, unknown and wrong-unit input", () => {
    expect(evaluateHyperkalaemiaEcgWorkflow({ ecgChanges: [], potassium: 6 })).toMatchObject({
      blockReason: "invalid-input",
      status: "blocked",
    });
    expect(
      evaluateHyperkalaemiaEcgWorkflow({
        ecgChanges: ["unknown" as HyperkalaemiaEcgChange],
        potassium: 6,
      }),
    ).toMatchObject({ blockReason: "invalid-input", status: "blocked" });
    expect(evaluateHyperkalaemiaEcgWorkflow({ potassium: 6, unit: "mEq/L" })).toMatchObject({
      blockReason: "invalid-input",
      status: "blocked",
    });
  });

  it("returns deterministic immutable snapshots", () => {
    const input = {
      ecgChanges: ["peaked-t-waves", "broad-qrs"] as HyperkalaemiaEcgChange[],
      potassium: 6.5,
    };
    const first = evaluateHyperkalaemiaEcgWorkflow(input);
    const second = evaluateHyperkalaemiaEcgWorkflow(input);

    expect(first).toEqual(second);
    expect(Object.isFrozen(first)).toBe(true);
    expect(Object.isFrozen(first.escalations)).toBe(true);
  });
});
