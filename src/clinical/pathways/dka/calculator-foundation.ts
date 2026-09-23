import type { PathwayCalculationResult, PathwayInputDatum } from "../../engine/index.ts";
import {
  dkaSourceRules,
  dkaSourceSteps,
  type DkaSourceRule,
  type DkaSourceStep,
  type DkaSourceStepNumber,
} from "./source-currentness.ts";

export const DKA_CALCULATOR_FOUNDATION_VERSION = "0.1.0";

export type DkaCalculatorFoundationStatus = "blocked-by-source-currentness";

export interface DkaCalculatorSession<TInputKey extends string = never> {
  readonly calculations: readonly PathwayCalculationResult[];
  readonly currentStepNumber: DkaSourceStepNumber;
  readonly inputs: Readonly<Partial<Record<TInputKey, PathwayInputDatum>>>;
  readonly status: DkaCalculatorFoundationStatus;
  readonly version: typeof DKA_CALCULATOR_FOUNDATION_VERSION;
}

export interface DkaInputKindContract {
  readonly kind: PathwayInputDatum["kind"];
  readonly validation: string;
}

export interface DkaFoundationDisplayStep {
  readonly mappedElements: readonly string[];
  readonly rules: readonly {
    readonly reviewStatus: DkaSourceRule["reviewStatus"];
    readonly title: string;
  }[];
  readonly stepNumber: DkaSourceStepNumber;
  readonly title: string;
}

export const dkaInputKindContracts: readonly DkaInputKindContract[] = Object.freeze([
  Object.freeze({
    kind: "numeric",
    validation: "Finite value, exact unit, declared range and declared precision",
  }),
  Object.freeze({
    kind: "single-choice",
    validation: "Exactly one value from a source-defined option set",
  }),
  Object.freeze({
    kind: "multi-select",
    validation: "Unique values within source-defined minimum and maximum selections",
  }),
  Object.freeze({
    kind: "boolean",
    validation: "Explicit true or false confirmation with no inferred default",
  }),
]);

export const dkaTransparentResultFields = Object.freeze([
  "Confirmed inputs used",
  "Source-defined formula",
  "Resolved operand values and units",
  "Unrestricted calculated value",
  "Applied source-defined limit",
  "Final value and unit",
  "Rounding mode and precision",
  "Internal source mapping",
] as const);

export function createDkaCalculatorFoundationSession(): DkaCalculatorSession {
  return Object.freeze({
    calculations: Object.freeze([]),
    currentStepNumber: 1,
    inputs: Object.freeze({}),
    status: "blocked-by-source-currentness",
    version: DKA_CALCULATOR_FOUNDATION_VERSION,
  });
}

export function navigateDkaCalculatorFoundation<TInputKey extends string>(
  session: DkaCalculatorSession<TInputKey>,
  stepNumber: DkaSourceStepNumber,
): DkaCalculatorSession<TInputKey> {
  if (!dkaSourceSteps.some((step) => step.stepNumber === stepNumber)) {
    throw new Error(`DKA source step ${stepNumber} is not registered.`);
  }

  if (session.currentStepNumber === stepNumber) {
    return session;
  }

  return Object.freeze({
    ...session,
    currentStepNumber: stepNumber,
  });
}

export function getDkaCalculatorFoundationStep(stepNumber: DkaSourceStepNumber): DkaSourceStep {
  const step = dkaSourceSteps.find((candidate) => candidate.stepNumber === stepNumber);

  if (!step) {
    throw new Error(`DKA source step ${stepNumber} is not registered.`);
  }

  return step;
}

export function getDkaCalculatorFoundationRules(
  stepNumber: DkaSourceStepNumber,
): readonly DkaSourceRule[] {
  getDkaCalculatorFoundationStep(stepNumber);

  return Object.freeze(
    dkaSourceRules.filter((rule) => rule.sourceStepNumbers.includes(stepNumber)),
  );
}

export function getDkaFoundationDisplaySteps(): readonly DkaFoundationDisplayStep[] {
  return Object.freeze(
    dkaSourceSteps.map((step) =>
      Object.freeze({
        mappedElements: step.mappedElements,
        rules: Object.freeze(
          getDkaCalculatorFoundationRules(step.stepNumber).map((rule) =>
            Object.freeze({ reviewStatus: rule.reviewStatus, title: rule.title }),
          ),
        ),
        stepNumber: step.stepNumber,
        title: step.title,
      }),
    ),
  );
}
