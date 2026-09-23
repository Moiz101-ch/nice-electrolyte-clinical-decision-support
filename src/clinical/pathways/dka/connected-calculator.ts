import { dkaStepsFiveToTenInputSchema, evaluateDkaStepsFiveToTen } from "./steps-five-to-ten.ts";
import { dkaStepsOneToFourInputSchema, evaluateDkaStepsOneToFour } from "./steps-one-to-four.ts";

export const DKA_CONNECTED_CALCULATOR_VERSION = "0.1.0";

export function evaluateDkaConnectedCalculator(input: unknown) {
  const initialInput =
    input && typeof input === "object" && "initial" in input ? input.initial : undefined;
  const initialParse = dkaStepsOneToFourInputSchema.safeParse(initialInput);
  const fullParse = dkaStepsFiveToTenInputSchema.safeParse(input);
  const initial = initialParse.success ? evaluateDkaStepsOneToFour(initialParse.data) : null;
  const later = fullParse.success ? evaluateDkaStepsFiveToTen(fullParse.data) : null;
  const startingRate = initial?.calculation?.output.value;
  const recordedRate = fullParse.success ? fullParse.data.monitoring.insulinRateUnitsPerHour : null;

  return Object.freeze({
    activeClinicalOutput: false as const,
    consistencyWarnings: Object.freeze(
      startingRate !== undefined &&
        recordedRate !== null &&
        Math.abs(startingRate - recordedRate) > 1e-8
        ? [
            "The recorded monitoring insulin rate differs from the calculated Step 4 starting rate. A later adjustment cannot be inferred from these inputs.",
          ]
        : [],
    ),
    inputIssues: Object.freeze(
      fullParse.success
        ? []
        : fullParse.error.issues.map((issue) => ({
            message: issue.message,
            path: issue.path.map(String).join("."),
          })),
    ),
    initial,
    later,
    version: DKA_CONNECTED_CALCULATOR_VERSION,
  });
}
