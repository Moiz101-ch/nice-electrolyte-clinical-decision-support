import type { PathwayEvaluationSnapshot } from "../../engine/index.ts";
import { evaluateHyponatraemiaEmergencyManagement } from "./emergency-management.ts";
import { evaluateHyponatraemiaFluidStatus } from "./fluid-status.ts";
import {
  evaluateHyponatraemiaManagement,
  type HyponatraemiaManagementEvaluationInput,
} from "./management.ts";
import {
  evaluateHyponatraemiaOsmolalityClassification,
  type HyponatraemiaOsmolalityClassificationEvaluation,
  type HyponatraemiaOsmolalityClassificationInput,
} from "./osmolality-classification.ts";
import {
  evaluateHyponatraemiaOperationalResult,
  type HyponatraemiaOperationalResult,
} from "./operational-result.ts";
import { evaluateHyponatraemiaSeverity, type HyponatraemiaSeverityEvaluation } from "./severity.ts";

export const HYPONATRAEMIA_CONNECTED_ASSESSMENT_VERSION = "0.7.0";

export interface HyponatraemiaConnectedAssessmentInput
  extends HyponatraemiaManagementEvaluationInput, HyponatraemiaOsmolalityClassificationInput {}

export interface HyponatraemiaConnectedAssessmentEvaluation {
  classification: HyponatraemiaOsmolalityClassificationEvaluation;
  completion: Readonly<{
    classification: boolean;
    emergency: boolean;
    fluidStatus: boolean;
    management: boolean;
    readyForResult: boolean;
    severity: boolean;
  }>;
  emergency: PathwayEvaluationSnapshot;
  emergencyRequired: boolean;
  euvolaemicCauseRequired: boolean;
  fluidStatus: PathwayEvaluationSnapshot;
  management: PathwayEvaluationSnapshot;
  operationalResult: HyponatraemiaOperationalResult;
  pathway: Readonly<{
    id: "hyponatraemia-connected-assessment";
    name: "Connected Hyponatraemia assessment";
    version: typeof HYPONATRAEMIA_CONNECTED_ASSESSMENT_VERSION;
  }>;
  severity: HyponatraemiaSeverityEvaluation;
}

export function evaluateHyponatraemiaConnectedAssessment(
  input: HyponatraemiaConnectedAssessmentInput,
): HyponatraemiaConnectedAssessmentEvaluation {
  const severity = evaluateHyponatraemiaSeverity(input.sodium, input.unit);
  const fluidStatus = evaluateHyponatraemiaFluidStatus(input);
  const emergency = evaluateHyponatraemiaEmergencyManagement(input);
  const management = evaluateHyponatraemiaManagement(input);
  const classification = evaluateHyponatraemiaOsmolalityClassification(input);
  const operationalResult = evaluateHyponatraemiaOperationalResult(input);
  const emergencyRequired = emergency.immediateActions.some(
    (action) => action.actionId === "administer-initial-hypertonic-saline",
  );
  const euvolaemicCauseRequired =
    input.fluidStatus === "euvolaemic" &&
    Boolean(input.cerebralOedemaSigns?.includes("none-confirmed"));
  const completion = {
    classification: classification.snapshot.status === "requires-clinical-review",
    emergency: !emergencyRequired || emergency.status === "requires-clinical-review",
    fluidStatus: fluidStatus.status === "requires-clinical-review",
    management: management.status === "requires-clinical-review",
    readyForResult: false,
    severity: severity.kind === "classified",
  };

  completion.readyForResult =
    completion.severity &&
    completion.fluidStatus &&
    completion.emergency &&
    completion.management &&
    completion.classification;

  return deepFreeze({
    classification,
    completion,
    emergency,
    emergencyRequired,
    euvolaemicCauseRequired,
    fluidStatus,
    management,
    operationalResult,
    pathway: {
      id: "hyponatraemia-connected-assessment",
      name: "Connected Hyponatraemia assessment",
      version: HYPONATRAEMIA_CONNECTED_ASSESSMENT_VERSION,
    },
    severity,
  });
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) deepFreeze(child);
    Object.freeze(value);
  }

  return value;
}
