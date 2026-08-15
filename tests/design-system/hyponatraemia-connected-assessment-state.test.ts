import { describe, expect, it } from "vitest";

import {
  hyponatraemiaAssessmentReducer,
  initialHyponatraemiaAssessmentState,
  type HyponatraemiaAssessmentViewState,
} from "@/components/pathways/hyponatraemia/connected-assessment-state";

const completeState: HyponatraemiaAssessmentViewState = {
  cerebralOedemaSigns: ["confusion"],
  euvolaemicUnderlyingCause: "siadh-established",
  fluidStatus: "euvolaemic",
  fourHourSodiumChange: "3.9",
  odsRiskStatus: "high-risk-confirmed",
  serumOsmolality: "270",
  sodium: "124",
  symptomResponse: "not-improved",
  urineOsmolality: "120",
  urineResultsAvailability: "available",
  urineSodium: "40.1",
};

describe("connected Hyponatraemia assessment state", () => {
  it("clears every downstream answer when sodium changes", () => {
    expect(
      hyponatraemiaAssessmentReducer(completeState, { type: "set-sodium", value: "129" }),
    ).toEqual({ ...initialHyponatraemiaAssessmentState, sodium: "129" });
  });

  it("clears clinical, emergency and classification dependants when fluid status changes", () => {
    expect(
      hyponatraemiaAssessmentReducer(completeState, {
        type: "set-fluid-status",
        value: "hypovolaemic",
      }),
    ).toEqual({
      ...initialHyponatraemiaAssessmentState,
      fluidStatus: "hypovolaemic",
      sodium: "124",
    });
  });

  it("clears emergency dependants without losing independent laboratory answers", () => {
    expect(
      hyponatraemiaAssessmentReducer(completeState, {
        type: "set-signs",
        value: ["none-confirmed"],
      }),
    ).toMatchObject({
      cerebralOedemaSigns: ["none-confirmed"],
      euvolaemicUnderlyingCause: null,
      fourHourSodiumChange: "",
      odsRiskStatus: null,
      serumOsmolality: "270",
      symptomResponse: null,
      urineOsmolality: "120",
      urineSodium: "40.1",
    });
  });

  it("clears only response dependants when ODS risk changes", () => {
    expect(
      hyponatraemiaAssessmentReducer(completeState, {
        type: "set-ods-risk",
        value: "high-risk-not-confirmed",
      }),
    ).toMatchObject({
      fourHourSodiumChange: "",
      odsRiskStatus: "high-risk-not-confirmed",
      serumOsmolality: "270",
      symptomResponse: null,
      urineSodium: "40.1",
    });
  });

  it("clears downstream laboratory answers when availability or serum osmolality changes", () => {
    const availability = hyponatraemiaAssessmentReducer(completeState, {
      type: "set-urine-results-availability",
      value: "not-available",
    });
    const serum = hyponatraemiaAssessmentReducer(completeState, {
      type: "set-serum-osmolality",
      value: "280",
    });

    expect(availability).toMatchObject({
      euvolaemicUnderlyingCause: null,
      serumOsmolality: "",
      urineOsmolality: "",
      urineResultsAvailability: "not-available",
      urineSodium: "",
    });
    expect(serum).toMatchObject({
      euvolaemicUnderlyingCause: null,
      serumOsmolality: "280",
      urineOsmolality: "",
      urineSodium: "",
    });
  });

  it("records a cause decision without changing completed assessment values", () => {
    expect(
      hyponatraemiaAssessmentReducer(
        { ...completeState, euvolaemicUnderlyingCause: null },
        {
          type: "set-euvolaemic-underlying-cause",
          value: "water-intoxication-established",
        },
      ),
    ).toMatchObject({
      euvolaemicUnderlyingCause: "water-intoxication-established",
      serumOsmolality: "270",
      sodium: "124",
      urineSodium: "40.1",
    });
  });
});
