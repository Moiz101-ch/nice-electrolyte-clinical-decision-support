import type { ValidatedAssessment, ClinicalContext } from "./assessment.ts";
import type { RuleCatalogue } from "./catalogue.ts";

export type RuleId = `NICE-${string}`;

export interface RuleMatchFact {
  field: string;
  label: string;
  value: boolean | number | string;
}

export type RuleEvaluatorDecision =
  | {
      kind: "match";
      facts: RuleMatchFact[];
      ruleId: RuleId;
    }
  | {
      kind: "blocked";
      missingFields: string[];
    }
  | {
      kind: "no-match";
    };

export interface RuleEvaluator {
  contexts: readonly ClinicalContext[];
  evaluate: (assessment: ValidatedAssessment) => RuleEvaluatorDecision;
  id: string;
  order: number;
}

export interface RuleEvaluationTraceEntry {
  decision: RuleEvaluatorDecision["kind"] | "error";
  evaluatorId: string;
}

export interface RuleEvaluationTrace {
  clinicalContext: ClinicalContext;
  entries: RuleEvaluationTraceEntry[];
}

export interface DeterministicExplanation {
  facts: RuleMatchFact[];
  summary: string;
  templateVersion: "1.0";
}

export interface RuleResultSource {
  checkedOn: string;
  guidanceCode: string;
  recommendationSections: string[];
  sourceId: string;
  title: string;
  url: string;
}

export interface RuleResult {
  assessment: {
    clinicalContext: ClinicalContext;
    condition: ValidatedAssessment["condition"];
    electrolyte: ValidatedAssessment["electrolyte"];
    measuredValue: number;
    unit: "mmol/L";
  };
  catalogueVersion: string;
  clinicalReviewStatus: "Pending" | "Approved" | "Rejected";
  explanation: DeterministicExplanation;
  limitations: string;
  managementOutput: string;
  outputStatus: string;
  priority: string;
  ruleId: RuleId;
  sources: RuleResultSource[];
  status: "matched" | "unsupported";
  trace: RuleEvaluationTrace;
  triggerSummary: string;
}

export interface BlockedRuleEvaluation {
  issues: Array<{
    field: string;
    message: string;
  }>;
  reason: "configuration-error" | "invalid-input" | "missing-required-inputs" | "out-of-scope";
  status: "blocked";
  trace: RuleEvaluationTrace | null;
}

export type RuleEngineOutcome = RuleResult | BlockedRuleEvaluation;

export interface RuleEngine {
  catalogue: RuleCatalogue;
  evaluate: (input: unknown) => RuleEngineOutcome;
}
