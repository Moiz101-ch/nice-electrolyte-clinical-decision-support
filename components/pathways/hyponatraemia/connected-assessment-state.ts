import type {
  CerebralOedemaSign,
  EuvolaemicUnderlyingCause,
  HyponatraemiaFluidStatus,
  HyponatraemiaSymptomResponse,
  OdsRiskStatus,
} from "@/src/clinical/pathways/hyponatraemia";

export type UrineResultAvailability = "available" | "not-available";

export interface HyponatraemiaAssessmentViewState {
  cerebralOedemaSigns: readonly CerebralOedemaSign[];
  euvolaemicUnderlyingCause: EuvolaemicUnderlyingCause | null;
  fluidStatus: HyponatraemiaFluidStatus | null;
  fourHourSodiumChange: string;
  odsRiskStatus: OdsRiskStatus | null;
  serumOsmolality: string;
  sodium: string;
  symptomResponse: HyponatraemiaSymptomResponse | null;
  urineOsmolality: string;
  urineResultsAvailability: UrineResultAvailability | null;
  urineSodium: string;
}

export type HyponatraemiaAssessmentAction =
  | { type: "reset" }
  | { type: "set-euvolaemic-underlying-cause"; value: EuvolaemicUnderlyingCause }
  | { type: "set-fluid-status"; value: HyponatraemiaFluidStatus }
  | { type: "set-four-hour-change"; value: string }
  | { type: "set-ods-risk"; value: OdsRiskStatus }
  | { type: "set-serum-osmolality"; value: string }
  | { type: "set-signs"; value: readonly CerebralOedemaSign[] }
  | { type: "set-sodium"; value: string }
  | { type: "set-symptom-response"; value: HyponatraemiaSymptomResponse }
  | { type: "set-urine-osmolality"; value: string }
  | { type: "set-urine-results-availability"; value: UrineResultAvailability }
  | { type: "set-urine-sodium"; value: string };

export const initialHyponatraemiaAssessmentState: HyponatraemiaAssessmentViewState = {
  cerebralOedemaSigns: [],
  euvolaemicUnderlyingCause: null,
  fluidStatus: null,
  fourHourSodiumChange: "",
  odsRiskStatus: null,
  serumOsmolality: "",
  sodium: "",
  symptomResponse: null,
  urineOsmolality: "",
  urineResultsAvailability: null,
  urineSodium: "",
};

export function hyponatraemiaAssessmentReducer(
  state: HyponatraemiaAssessmentViewState,
  action: HyponatraemiaAssessmentAction,
): HyponatraemiaAssessmentViewState {
  switch (action.type) {
    case "reset":
      return initialHyponatraemiaAssessmentState;
    case "set-sodium":
      return { ...initialHyponatraemiaAssessmentState, sodium: action.value };
    case "set-fluid-status":
      return {
        ...initialHyponatraemiaAssessmentState,
        fluidStatus: action.value,
        sodium: state.sodium,
      };
    case "set-signs":
      return {
        ...state,
        cerebralOedemaSigns: action.value,
        euvolaemicUnderlyingCause: null,
        fourHourSodiumChange: "",
        odsRiskStatus: null,
        symptomResponse: null,
      };
    case "set-ods-risk":
      return {
        ...state,
        fourHourSodiumChange: "",
        odsRiskStatus: action.value,
        symptomResponse: null,
      };
    case "set-symptom-response":
      return { ...state, fourHourSodiumChange: "", symptomResponse: action.value };
    case "set-four-hour-change":
      return { ...state, fourHourSodiumChange: action.value };
    case "set-urine-results-availability":
      return {
        ...state,
        euvolaemicUnderlyingCause: null,
        serumOsmolality: "",
        urineOsmolality: "",
        urineResultsAvailability: action.value,
        urineSodium: "",
      };
    case "set-serum-osmolality":
      return {
        ...state,
        euvolaemicUnderlyingCause: null,
        serumOsmolality: action.value,
        urineOsmolality: "",
        urineSodium: "",
      };
    case "set-urine-osmolality":
      return {
        ...state,
        euvolaemicUnderlyingCause: null,
        urineOsmolality: action.value,
        urineSodium: "",
      };
    case "set-urine-sodium":
      return { ...state, euvolaemicUnderlyingCause: null, urineSodium: action.value };
    case "set-euvolaemic-underlying-cause":
      return { ...state, euvolaemicUnderlyingCause: action.value };
  }
}
