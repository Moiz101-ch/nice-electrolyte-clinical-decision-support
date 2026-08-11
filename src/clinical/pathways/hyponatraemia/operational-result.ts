import type {
  PathwayAction,
  PathwayEvaluationIssue,
  PathwayEvaluationStatus,
  PathwayMonitoringItem,
  PathwayWarning,
} from "../../engine/index.ts";
import type { PathwaySourceReference } from "../schema.ts";
import {
  evaluateHyponatraemiaEmergencyManagement,
  type HyponatraemiaEmergencyEvaluationInput,
} from "./emergency-management.ts";
import {
  CEREBRAL_OEDEMA_SIGN_OPTIONS,
  HYPONATRAEMIA_FLUID_STATUS_OPTIONS,
} from "./fluid-status.ts";
import {
  evaluateHyponatraemiaOsmolalityClassification,
  type HyponatraemiaCausePattern,
  type HyponatraemiaOsmolalityClassificationInput,
  type HyponatraemiaSerumTonicity,
} from "./osmolality-classification.ts";
import { evaluateHyponatraemiaSeverity, type HyponatraemiaSeverity } from "./severity.ts";

export const HYPONATRAEMIA_OPERATIONAL_RESULT_VERSION = "0.5.0";

export interface HyponatraemiaOperationalResultInput
  extends HyponatraemiaEmergencyEvaluationInput, HyponatraemiaOsmolalityClassificationInput {}

export interface HyponatraemiaOperationalSeverity {
  label: string;
  rangeLabel: string;
  severity: HyponatraemiaSeverity;
  unit: string;
  value: number;
}

export interface HyponatraemiaOperationalBranch {
  detail: string;
  label: string;
}

export interface HyponatraemiaOperationalResult {
  causePattern: Readonly<HyponatraemiaCausePattern> | null;
  clinicalReviewStatus: "awaiting-clinical-review";
  confirmedSignLabels: readonly string[];
  currentBranch: Readonly<HyponatraemiaOperationalBranch>;
  escalationSummary: string;
  fluidStatusLabel: string | null;
  immediateActions: readonly PathwayAction[];
  issues: readonly PathwayEvaluationIssue[];
  monitoring: readonly PathwayMonitoringItem[];
  nextActions: readonly PathwayAction[];
  pathway: Readonly<{
    id: "hyponatraemia-operational-result";
    name: "Hyponatraemia operational result";
    version: typeof HYPONATRAEMIA_OPERATIONAL_RESULT_VERSION;
  }>;
  serumTonicity: HyponatraemiaSerumTonicity | null;
  severity: Readonly<HyponatraemiaOperationalSeverity> | null;
  sourceReferences: readonly PathwaySourceReference[];
  status: Extract<
    PathwayEvaluationStatus,
    "awaiting-input" | "blocked" | "requires-clinical-review" | "unsupported"
  >;
  treatmentTarget: string | null;
  warnings: readonly PathwayWarning[];
  whySelected: readonly string[];
}

export function evaluateHyponatraemiaOperationalResult(
  input: HyponatraemiaOperationalResultInput,
): HyponatraemiaOperationalResult {
  const severityEvaluation = evaluateHyponatraemiaSeverity(input.sodium, input.unit);
  const emergencySnapshot = evaluateHyponatraemiaEmergencyManagement(input);
  const classificationEvaluation = evaluateHyponatraemiaOsmolalityClassification(input);
  const classificationSnapshot = classificationEvaluation.snapshot;
  const immediateActions = uniqueBy(
    emergencySnapshot.immediateActions,
    (action) => action.actionId,
  );
  const nextActions = uniqueBy(emergencySnapshot.nextActions, (action) => action.actionId);
  const warnings = uniqueBy(
    [...emergencySnapshot.warnings, ...classificationSnapshot.warnings],
    (warning) => warning.warningId,
  );
  const monitoring = uniqueBy(emergencySnapshot.monitoring, (item) => item.monitoringId);
  const issues = uniqueBy(
    [
      ...severityEvaluation.snapshot.issues,
      ...emergencySnapshot.issues,
      ...classificationSnapshot.issues,
    ],
    (issue) => `${issue.field}:${issue.message}`,
  );
  const sourceReferences = uniqueBy(
    [
      ...severityEvaluation.snapshot.sourceReferences,
      ...emergencySnapshot.sourceReferences,
      ...classificationSnapshot.sourceReferences,
    ],
    sourceReferenceKey,
  );
  const severity =
    severityEvaluation.kind === "classified"
      ? {
          label: severityEvaluation.band.label,
          rangeLabel: severityEvaluation.band.sourceRangeLabel,
          severity: severityEvaluation.band.severity,
          unit: severityEvaluation.unit,
          value: severityEvaluation.value,
        }
      : null;
  const fluidStatusLabel =
    HYPONATRAEMIA_FLUID_STATUS_OPTIONS.find((option) => option.value === input.fluidStatus)
      ?.label ?? null;
  const confirmedSignLabels = (input.cerebralOedemaSigns ?? [])
    .filter((sign) => sign !== "none-confirmed")
    .map(
      (sign) => CEREBRAL_OEDEMA_SIGN_OPTIONS.find((option) => option.value === sign)?.label ?? sign,
    );
  const treatmentTarget =
    emergencySnapshot.information.find((item) => item.nodeId === "correction-target-information")
      ?.body ?? null;

  const result: HyponatraemiaOperationalResult = {
    causePattern: classificationEvaluation.causePattern,
    clinicalReviewStatus: "awaiting-clinical-review",
    confirmedSignLabels,
    currentBranch: currentBranch(emergencySnapshot, classificationEvaluation.causePattern),
    escalationSummary: escalationSummary(immediateActions, nextActions),
    fluidStatusLabel,
    immediateActions,
    issues,
    monitoring,
    nextActions,
    pathway: {
      id: "hyponatraemia-operational-result",
      name: "Hyponatraemia operational result",
      version: HYPONATRAEMIA_OPERATIONAL_RESULT_VERSION,
    },
    serumTonicity: classificationEvaluation.serumTonicity,
    severity,
    sourceReferences,
    status: operationalStatus(
      severityEvaluation.kind,
      emergencySnapshot.status,
      classificationSnapshot.status,
    ),
    treatmentTarget,
    warnings,
    whySelected: buildWhySelected(input, severity, classificationEvaluation.serumTonicity),
  };

  return deepFreeze(result);
}

function operationalStatus(
  severityKind: "classified" | "invalid" | "unsupported",
  emergencyStatus: PathwayEvaluationStatus,
  classificationStatus: PathwayEvaluationStatus,
): HyponatraemiaOperationalResult["status"] {
  if (
    severityKind === "invalid" ||
    emergencyStatus === "blocked" ||
    classificationStatus === "blocked"
  ) {
    return "blocked";
  }

  if (
    severityKind === "unsupported" ||
    emergencyStatus === "unsupported" ||
    classificationStatus === "unsupported"
  ) {
    return "unsupported";
  }

  if (emergencyStatus === "awaiting-input" || classificationStatus === "awaiting-input") {
    return "awaiting-input";
  }

  return "requires-clinical-review";
}

function currentBranch(
  emergencySnapshot: ReturnType<typeof evaluateHyponatraemiaEmergencyManagement>,
  causePattern: Readonly<HyponatraemiaCausePattern> | null,
): HyponatraemiaOperationalBranch {
  if (emergencySnapshot.status === "blocked") {
    return {
      detail: "Invalid or contradictory information prevented deterministic branch selection.",
      label: "No branch selected",
    };
  }

  const hasEmergencyTreatment = emergencySnapshot.immediateActions.some(
    (action) => action.actionId === "administer-initial-hypertonic-saline",
  );
  const hasRepeatDose = emergencySnapshot.immediateActions.some(
    (action) => action.actionId === "repeat-hypertonic-saline-dose",
  );
  const hasCauseManagement = emergencySnapshot.nextActions.some(
    (action) => action.actionId === "diagnose-manage-cause-consultant-review",
  );

  if (hasRepeatDose) {
    return {
      detail: "The follow-up response selected the immediate repeat-treatment endpoint.",
      label: "Repeat-dose emergency branch",
    };
  }

  if (hasEmergencyTreatment) {
    return {
      detail: hasCauseManagement
        ? "The symptomatic emergency branch reached cause management with consultant review."
        : "The symptomatic emergency branch is awaiting or requires a follow-up decision.",
      label: "Symptomatic emergency management",
    };
  }

  if (causePattern) {
    return {
      detail:
        "No emergency-treatment action was selected; classification reached a compatible cause category.",
      label: causePattern.label,
    };
  }

  return {
    detail: "No emergency-treatment or compatible cause endpoint has been selected.",
    label: "Assessment incomplete",
  };
}

function escalationSummary(
  immediateActions: readonly PathwayAction[],
  nextActions: readonly PathwayAction[],
): string {
  if (
    [...immediateActions, ...nextActions].some((action) =>
      /consultant review/i.test(action.instruction),
    )
  ) {
    return "Consultant review is included in the selected action. No separate escalation urgency or destination is defined by the implemented pathway.";
  }

  return "No explicit escalation action has been selected by the implemented pathway.";
}

function buildWhySelected(
  input: HyponatraemiaOperationalResultInput,
  severity: Readonly<HyponatraemiaOperationalSeverity> | null,
  serumTonicity: HyponatraemiaSerumTonicity | null,
): string[] {
  const explanations: string[] = [];

  if (severity) {
    explanations.push(
      `Sodium ${severity.value} ${severity.unit} selected ${severity.label} (${severity.rangeLabel}).`,
    );
  }

  const fluidStatusLabel = HYPONATRAEMIA_FLUID_STATUS_OPTIONS.find(
    (option) => option.value === input.fluidStatus,
  )?.label;
  const signs = (input.cerebralOedemaSigns ?? []).filter((sign) => sign !== "none-confirmed");

  if (fluidStatusLabel && signs.length > 0) {
    const signLabels = signs.map(
      (sign) => CEREBRAL_OEDEMA_SIGN_OPTIONS.find((option) => option.value === sign)?.label ?? sign,
    );
    explanations.push(
      `${fluidStatusLabel} fluid status and confirmed ${joinLabels(signLabels)} selected the symptomatic emergency branch.`,
    );
  } else if (fluidStatusLabel && input.cerebralOedemaSigns?.includes("none-confirmed")) {
    explanations.push(
      `${fluidStatusLabel} fluid status with no listed sign confirmed did not select emergency treatment.`,
    );
  }

  if (input.odsRiskStatus === "high-risk-confirmed") {
    explanations.push("Confirmed high ODS risk selected enhanced sodium monitoring.");
  }

  if (input.symptomResponse === "improved") {
    explanations.push(
      "Confirmed symptomatic improvement selected cause management as the next action.",
    );
  } else if (
    (input.symptomResponse === "not-improved" || input.symptomResponse === "unable-to-assess") &&
    input.fourHourSodiumChange !== undefined
  ) {
    explanations.push(
      `The follow-up response and a four-hour sodium change of ${input.fourHourSodiumChange} mmol/L selected the recorded response endpoint.`,
    );
  }

  if (serumTonicity && input.serumOsmolality !== undefined) {
    explanations.push(
      `Serum osmolality ${input.serumOsmolality} mOsm/kg selected the ${serumTonicity} classification.`,
    );
  }

  if (input.urineOsmolality !== undefined) {
    explanations.push(
      `Urine osmolality ${input.urineOsmolality} mOsm/kg was evaluated in the ${fluidStatusLabel?.toLowerCase() ?? "selected fluid-status"} branch.`,
    );
  }

  if (input.urineSodium !== undefined) {
    explanations.push(
      `Urine sodium ${input.urineSodium} mEq/L was evaluated without inferring an unstated boundary result.`,
    );
  }

  return explanations;
}

function uniqueBy<T>(values: readonly T[], keyFor: (value: T) => string): T[] {
  const seen = new Set<string>();

  return values.filter((value) => {
    const key = keyFor(value);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function sourceReferenceKey(reference: PathwaySourceReference): string {
  return `${reference.sourceId}:${reference.page}:${reference.section}`;
}

function joinLabels(labels: readonly string[]): string {
  if (labels.length <= 1) return labels[0] ?? "listed symptoms";
  return `${labels.slice(0, -1).join(", ")} and ${labels.at(-1)}`;
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) deepFreeze(child);
    Object.freeze(value);
  }

  return value;
}
