import { z } from "zod";

import { pathwayDataKeySchema } from "../pathways/schema.ts";
import type { PathwayDefinition, PathwayNode, PathwaySourceReference } from "../pathways/schema.ts";

export const pathwayInputDatumSchema = z.discriminatedUnion("kind", [
  z
    .object({
      kind: z.literal("boolean"),
      value: z.boolean(),
    })
    .strict(),
  z
    .object({
      kind: z.literal("multi-select"),
      values: z.array(z.string().trim().min(1)).superRefine((values, context) => {
        if (new Set(values).size !== values.length) {
          context.addIssue({
            code: "custom",
            message: "Multi-select input values must be unique.",
          });
        }
      }),
    })
    .strict(),
  z
    .object({
      kind: z.literal("numeric"),
      unit: z.string().trim().min(1),
      value: z.number().finite(),
    })
    .strict(),
  z
    .object({
      kind: z.literal("single-choice"),
      value: z.string().trim().min(1),
    })
    .strict(),
]);

export const pathwayEvaluationRequestSchema = z
  .object({
    inputs: z.record(pathwayDataKeySchema, pathwayInputDatumSchema),
  })
  .strict();

export type PathwayInputDatum = z.infer<typeof pathwayInputDatumSchema>;
export type PathwayEvaluationRequest = z.infer<typeof pathwayEvaluationRequestSchema>;

type ActionNode = Extract<PathwayNode, { type: "action-group" }>;
type WarningNode = Extract<PathwayNode, { type: "warning" }>;
type MonitoringNode = Extract<PathwayNode, { type: "monitoring" }>;
type EscalationNode = Extract<PathwayNode, { type: "escalation" }>;

export type PathwayAction = ActionNode["actions"][number];
export type PathwayWarning = WarningNode["warnings"][number];
export type PathwayMonitoringItem = MonitoringNode["items"][number];
export type PathwayEscalation = EscalationNode["items"][number];

export type PathwayEvaluationStatus =
  "awaiting-input" | "blocked" | "completed" | "requires-clinical-review" | "unsupported";

export type PathwayBlockReason =
  | "ambiguous-branch"
  | "calculation-error"
  | "cycle-detected"
  | "invalid-input"
  | "invalid-request"
  | "missing-required-input"
  | "unmatched-branch";

export interface PathwayEvaluationIssue {
  readonly field: string;
  readonly message: string;
}

export interface PathwayCurrentNode {
  readonly id: string;
  readonly title: string;
  readonly type: PathwayNode["type"];
}

export interface PathwaySelectedBranch {
  readonly branchId: string;
  readonly label: string;
  readonly nodeId: string;
}

export type PathwayDerivedClassification = PathwaySelectedBranch;

export interface PathwayDerivedValue {
  readonly unit: string;
  readonly value: number;
}

export interface PathwayInformationItem {
  readonly body: string;
  readonly nodeId: string;
  readonly sourceReferences: readonly PathwaySourceReference[];
  readonly title: string;
}

export interface PathwayTraceEntry {
  readonly branchId: string | null;
  readonly nextNodeId: string | null;
  readonly nodeId: string;
  readonly nodeType: PathwayNode["type"];
  readonly outcome: "advanced" | "awaiting-input" | "blocked" | "branched" | "stopped";
}

export interface PathwayDeterministicExplanation {
  readonly steps: readonly string[];
  readonly summary: string;
  readonly templateVersion: "1.0";
}

export interface PathwayEvaluationSnapshot {
  readonly blockReason: PathwayBlockReason | null;
  readonly clinicalReviewStatus: PathwayDefinition["status"];
  readonly confirmedInputs: Readonly<Record<string, PathwayInputDatum>>;
  readonly currentNode: PathwayCurrentNode | null;
  readonly derivedClassifications: readonly PathwayDerivedClassification[];
  readonly derivedValues: Readonly<Record<string, PathwayDerivedValue>>;
  readonly escalations: readonly PathwayEscalation[];
  readonly explanation: PathwayDeterministicExplanation;
  readonly immediateActions: readonly PathwayAction[];
  readonly information: readonly PathwayInformationItem[];
  readonly issues: readonly PathwayEvaluationIssue[];
  readonly monitoring: readonly PathwayMonitoringItem[];
  readonly nextActions: readonly PathwayAction[];
  readonly pathway: {
    readonly id: string;
    readonly name: string;
    readonly version: string;
  };
  readonly selectedBranches: readonly PathwaySelectedBranch[];
  readonly sourceReferences: readonly PathwaySourceReference[];
  readonly status: PathwayEvaluationStatus;
  readonly stopReason: string | null;
  readonly trace: readonly PathwayTraceEntry[];
  readonly warnings: readonly PathwayWarning[];
}

export interface PathwayEngine {
  readonly definition: PathwayDefinition;
  evaluate(request: unknown): PathwayEvaluationSnapshot;
}
