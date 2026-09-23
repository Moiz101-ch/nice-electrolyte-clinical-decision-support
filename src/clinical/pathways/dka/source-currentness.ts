import { getSourceCurrentness, type SourceCurrentness } from "../../sources/registry.ts";
import type { ClinicalSource } from "../../sources/schema.ts";

export const DKA_SOURCE_ID = "YTH-DKA-V9-2019";

export type DkaSourceStepNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
export type DkaRuleKind =
  "calculation" | "logical-rule" | "threshold-set" | "timed-protocol" | "trend";
export type DkaRuleReviewStatus = "blocked-by-source-conflict" | "mapped-for-review";

export interface DkaSourceStep {
  readonly mappedElements: readonly string[];
  readonly ruleIds: readonly string[];
  readonly sourcePage: number;
  readonly stepNumber: DkaSourceStepNumber;
  readonly summary: string;
  readonly title: string;
}

export interface DkaSourceRule {
  readonly description: string;
  readonly expression: string;
  readonly kind: DkaRuleKind;
  readonly reviewStatus: DkaRuleReviewStatus;
  readonly ruleId: string;
  readonly sourcePage: number;
  readonly sourceSection: string;
  readonly sourceStepNumbers: readonly DkaSourceStepNumber[];
  readonly title: string;
}

export interface DkaSupplementarySection {
  readonly mappedElements: readonly string[];
  readonly sourcePage: number;
  readonly title: string;
}

export interface DkaProjectClinicalApproval {
  readonly approvedBy: string;
  readonly approvedOn: string;
  readonly sourceId: string;
  readonly sourceSha256: string;
}

export type DkaGateRequirementId =
  | "clinical-approval-record"
  | "internal-conflict"
  | "public-display-reuse"
  | "registry-review-status"
  | "source-currentness";

export interface DkaGateRequirement {
  readonly detail: string;
  readonly label: string;
  readonly requirementId: DkaGateRequirementId;
  readonly status: "blocked" | "met";
}

export interface DkaSourceCurrentnessGate {
  readonly activationAllowed: boolean;
  readonly currentness: SourceCurrentness;
  readonly requirements: readonly DkaGateRequirement[];
}

export const dkaSourceSteps: readonly DkaSourceStep[] = Object.freeze([
  sourceStep(1, "Initial assessment", 1, [
    "ABCDE, neurological status and early-warning assessment",
    "Blood glucose, blood ketones and weight",
    "IV access and initial laboratory investigations",
  ]),
  sourceStep(
    2,
    "Confirm the diagnosis",
    1,
    ["Glucose criterion", "Ketone criterion", "Venous pH or bicarbonate criterion"],
    ["diagnostic-confirmation"],
  ),
  sourceStep(
    3,
    "Initial fluid resuscitation",
    1,
    ["Systolic blood-pressure branch", "Reassessment after initial fluid", "Escalation branch"],
    ["systolic-pressure-fluid-branch"],
  ),
  sourceStep(
    4,
    "Start fixed-rate IV insulin infusion",
    1,
    ["Weight-based starting rate", "Source-defined maximum", "Long-acting insulin context"],
    ["initial-insulin-rate"],
  ),
  sourceStep(
    5,
    "Further assessment",
    2,
    ["Full clinical examination", "Precipitating factors", "Critical-care review criteria"],
    ["critical-care-escalation"],
  ),
  sourceStep(
    6,
    "Fluid replacement",
    2,
    ["Eight-hour replacement sequence", "Fluid-risk contexts", "Glucose-fluid trigger"],
    ["fluid-replacement-schedule"],
  ),
  sourceStep(
    7,
    "Further monitoring",
    2,
    ["Hourly observations", "Glucose and potassium branches", "Urine, airway and oxygen checks"],
    ["monitoring-action-branches", "oliguria-threshold"],
  ),
  sourceStep(
    8,
    "Assess response to treatment",
    2,
    ["Hourly ketone, bicarbonate and glucose trends", "Delivery-system checks", "Rate adjustment"],
    ["hourly-treatment-response"],
  ),
  sourceStep(
    9,
    "Target of treatment: resolution of ketoacidosis",
    2,
    ["Ketone endpoint", "Acid-base endpoint", "Transition to variable-rate insulin"],
    ["dka-resolution"],
  ),
  sourceStep(
    10,
    "Conversion to subcutaneous insulin",
    4,
    ["Readiness for conversion", "Existing or new insulin context", "IV-to-subcutaneous overlap"],
    ["subcutaneous-transition-timing"],
  ),
]);

export const dkaSourceRules: readonly DkaSourceRule[] = Object.freeze([
  sourceRule({
    description:
      "The source requires all three diagnostic categories, with pH or bicarbonate satisfying the acid-base category.",
    expression: "glucose > 11 AND ketones > 3 AND (pH < 7.3 OR bicarbonate < 15)",
    kind: "logical-rule",
    ruleId: "diagnostic-confirmation",
    sourcePage: 1,
    sourceSection: "Confirm the diagnosis",
    sourceStepNumbers: [2],
    title: "Diagnostic confirmation",
  }),
  sourceRule({
    description:
      "The initial fluid branch depends on systolic blood pressure and requires reassessment when the threshold is not met.",
    expression: "systolic blood pressure > 90",
    kind: "threshold-set",
    ruleId: "systolic-pressure-fluid-branch",
    sourcePage: 1,
    sourceSection: "Initial fluid resuscitation",
    sourceStepNumbers: [3],
    title: "Systolic-pressure branch",
  }),
  sourceRule({
    description:
      "The source calculates a weight-based starting infusion rate and applies a stated maximum.",
    expression: "minimum of (weight in kg x 0.1 units/kg/hour) and 15 units/hour",
    kind: "calculation",
    ruleId: "initial-insulin-rate",
    sourcePage: 1,
    sourceSection: "Start fixed-rate IV insulin infusion",
    sourceStepNumbers: [4],
    title: "Initial insulin infusion rate",
  }),
  sourceRule({
    description:
      "Eight source-listed observations form a deterministic escalation set for critical-care review.",
    expression:
      "ketones > 6 OR bicarbonate < 5 OR pH < 7.1 OR potassium < 3.5 OR GCS < 12 OR oxygen saturation < 92 OR systolic blood pressure < 90 OR pulse > 100 OR pulse < 60",
    kind: "threshold-set",
    ruleId: "critical-care-escalation",
    sourcePage: 2,
    sourceSection: "Further assessment",
    sourceStepNumbers: [5],
    title: "Critical-care escalation criteria",
  }),
  sourceRule({
    description:
      "The source defines a sequenced replacement schedule and identifies contexts requiring extra caution.",
    expression: "initial 1-hour bag, followed by 2-hour, 2-hour and 4-hour bags",
    kind: "timed-protocol",
    ruleId: "fluid-replacement-schedule",
    sourcePage: 2,
    sourceSection: "Fluid replacement",
    sourceStepNumbers: [3, 6],
    title: "Fluid replacement schedule",
  }),
  sourceRule({
    description:
      "The monitoring stage branches on glucose, potassium, urine output, oxygen saturation, vomiting and consciousness.",
    expression: "glucose < 14; potassium > 5.5, 3.5 to 5.5, or < 3.5; oxygen saturation < 92",
    kind: "threshold-set",
    ruleId: "monitoring-action-branches",
    sourcePage: 2,
    sourceSection: "Further monitoring",
    sourceStepNumbers: [7],
    title: "Monitoring action branches",
  }),
  sourceRule({
    description: "The source defines oliguria as a weight-normalised hourly urine-output rate.",
    expression: "oliguria threshold in mL/hour = weight in kg x 0.5 mL/kg/hour",
    kind: "calculation",
    ruleId: "oliguria-threshold",
    sourcePage: 2,
    sourceSection: "Further monitoring",
    sourceStepNumbers: [7],
    title: "Weight-based oliguria threshold",
  }),
  sourceRule({
    description:
      "Hourly change from baseline or the previous observation must be calculated for ketones, bicarbonate and glucose.",
    expression: "ketone fall >= 0.5/hour OR bicarbonate rise >= 3/hour, AND glucose fall >= 3/hour",
    kind: "trend",
    ruleId: "hourly-treatment-response",
    sourcePage: 2,
    sourceSection: "Assess response to treatment",
    sourceStepNumbers: [8],
    title: "Hourly treatment response",
  }),
  sourceRule({
    description:
      "The numbered step and monitoring chart use different AND/OR logic and different inclusive handling for bicarbonate, so no executable resolution rule can be selected.",
    expression: "Step 9: ketones < 0.6 AND (pH > 7.3 OR bicarbonate > 18); chart wording differs",
    kind: "logical-rule",
    reviewStatus: "blocked-by-source-conflict",
    ruleId: "dka-resolution",
    sourcePage: 2,
    sourceSection: "Resolution of ketoacidosis and hourly monitoring chart",
    sourceStepNumbers: [9],
    title: "DKA resolution",
  }),
  sourceRule({
    description:
      "The conversion stage defines timing relationships between meal-associated subcutaneous insulin and discontinuation of IV insulin.",
    expression: "source-defined IV/subcutaneous overlap timing by existing insulin regimen",
    kind: "timed-protocol",
    ruleId: "subcutaneous-transition-timing",
    sourcePage: 4,
    sourceSection: "Conversion to subcutaneous insulin",
    sourceStepNumbers: [10],
    title: "Subcutaneous transition timing",
  }),
]);

export const dkaSupplementarySections: readonly DkaSupplementarySection[] = Object.freeze([
  Object.freeze({
    mappedElements: Object.freeze([
      "Twenty-four-hour observation timeline",
      "Hourly glucose, ketone, acid-base, potassium, fluid, insulin and urine-output fields",
      "Treatment-response aims",
      "Resolution wording that conflicts with the numbered pathway",
    ]),
    sourcePage: 3,
    title: "Adult DKA hourly monitoring chart",
  }),
]);

export function evaluateDkaSourceCurrentnessGate(
  source: Readonly<ClinicalSource>,
  asOf: string,
  approval: Readonly<DkaProjectClinicalApproval> | null = null,
): DkaSourceCurrentnessGate {
  const currentness = getSourceCurrentness(source, asOf);
  const approvalMatches = Boolean(
    approval &&
    approval.approvedBy.trim() &&
    isValidApprovalDate(approval.approvedOn, asOf) &&
    approval.sourceId === source.sourceId &&
    approval.sourceSha256 === source.sha256,
  );
  const currentnessAccepted = currentness !== "review-overdue" && currentness !== "unknown";
  const requirements: DkaGateRequirement[] = [
    {
      detail: currentnessAccepted
        ? "The registered review date is not overdue."
        : approvalMatches
          ? "A matching project clinical approval explicitly accepts the registered source version."
          : "The registered review date is overdue; a current source or matching clinician currentness decision is required.",
      label: "Source currentness confirmed",
      requirementId: "source-currentness",
      status: currentnessAccepted || approvalMatches ? "met" : "blocked",
    },
    {
      detail: source.governanceFlags.includes("internal-content-conflict")
        ? "The conflicting resolution wording remains recorded in source governance."
        : "No unresolved internal source conflict is registered.",
      label: "Internal source conflict resolved",
      requirementId: "internal-conflict",
      status: source.governanceFlags.includes("internal-content-conflict") ? "blocked" : "met",
    },
    {
      detail:
        source.clinicalReviewStatus === "approved-for-project-use"
          ? "The source registry records approval for project use."
          : `The source registry status is ${source.clinicalReviewStatus.replaceAll("-", " ")}.`,
      label: "Registry clinical-review status approved",
      requirementId: "registry-review-status",
      status: source.clinicalReviewStatus === "approved-for-project-use" ? "met" : "blocked",
    },
    {
      detail: approvalMatches
        ? "A dated approval record matches this source identifier and file hash."
        : "No dated project clinical approval matching this exact source file is recorded.",
      label: "Explicit project clinical approval recorded",
      requirementId: "clinical-approval-record",
      status: approvalMatches ? "met" : "blocked",
    },
    {
      detail:
        source.reuseStatus === "approved-for-public-display"
          ? "Public-display reuse is approved."
          : "The registered source is restricted to internal verification.",
      label: "Public-display reuse cleared",
      requirementId: "public-display-reuse",
      status: source.reuseStatus === "approved-for-public-display" ? "met" : "blocked",
    },
  ];

  return Object.freeze({
    activationAllowed: requirements.every(({ status }) => status === "met"),
    currentness,
    requirements: Object.freeze(requirements.map((requirement) => Object.freeze(requirement))),
  });
}

function isValidApprovalDate(value: string, asOf: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value > asOf) {
    return false;
  }

  const [yearText, monthText, dayText] = value.split("-");
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const parsed = new Date(Date.UTC(year, month - 1, day));

  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
  );
}

function sourceRule(
  rule: Omit<DkaSourceRule, "reviewStatus"> & Partial<Pick<DkaSourceRule, "reviewStatus">>,
): DkaSourceRule {
  return Object.freeze({
    ...rule,
    reviewStatus: rule.reviewStatus ?? "mapped-for-review",
    sourceStepNumbers: Object.freeze([...rule.sourceStepNumbers]),
  });
}

function sourceStep(
  stepNumber: DkaSourceStepNumber,
  title: string,
  sourcePage: number,
  mappedElements: readonly string[],
  ruleIds: readonly string[] = [],
): DkaSourceStep {
  return Object.freeze({
    mappedElements: Object.freeze([...mappedElements]),
    ruleIds: Object.freeze([...ruleIds]),
    sourcePage,
    stepNumber,
    summary: mappedElements.join("; "),
    title,
  });
}
