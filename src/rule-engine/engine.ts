import { validatedAssessmentSchema, type ClinicalContext } from "./assessment.ts";
import { loadRuleCatalogue, type RuleCatalogue } from "./catalogue.ts";
import { hyperkalaemiaEvaluators } from "./hyperkalaemia.ts";
import { remainingNiceRuleEvaluators } from "./remaining-rules.ts";
import {
  RuleConfigurationError,
  buildRuleResult,
  buildUnsupportedResult,
} from "./result-builder.ts";
import type {
  BlockedRuleEvaluation,
  RuleEngine,
  RuleEvaluationTrace,
  RuleEvaluator,
  RuleEvaluatorDecision,
} from "./types.ts";

interface CreateRuleEngineOptions {
  catalogue?: RuleCatalogue;
  evaluators?: readonly RuleEvaluator[];
}

export function createRuleEngine(options: CreateRuleEngineOptions = {}): RuleEngine {
  const catalogue = options.catalogue ?? loadRuleCatalogue();
  const evaluators = validateAndSortEvaluators(
    options.evaluators ?? [...hyperkalaemiaEvaluators, ...remainingNiceRuleEvaluators],
  );
  const evaluatorsByContext = groupEvaluatorsByContext(evaluators);

  return Object.freeze({
    catalogue,
    evaluate: (input: unknown) => {
      const parsedAssessment = validatedAssessmentSchema.safeParse(input);

      if (!parsedAssessment.success) {
        return {
          issues: parsedAssessment.error.issues.map((issue) => ({
            field: issue.path.length === 0 ? "root" : issue.path.join("."),
            message: issue.message,
          })),
          reason: "invalid-input",
          status: "blocked",
          trace: null,
        } satisfies BlockedRuleEvaluation;
      }

      const assessment = parsedAssessment.data;
      const trace: RuleEvaluationTrace = {
        clinicalContext: assessment.clinicalContext,
        entries: [],
      };

      if (assessment.context.pregnancyStatus === "pregnant") {
        return {
          issues: [
            {
              field: "context.pregnancyStatus",
              message:
                "Pregnancy is outside the adult-general MVP scope. Use a pregnancy-specific pathway or specialist review.",
            },
          ],
          reason: "out-of-scope",
          status: "blocked",
          trace,
        } satisfies BlockedRuleEvaluation;
      }

      const contextEvaluators = evaluatorsByContext.get(assessment.clinicalContext) ?? [];

      for (const evaluator of contextEvaluators) {
        let decision: RuleEvaluatorDecision;

        try {
          decision = evaluator.evaluate(assessment);
        } catch {
          trace.entries.push({ decision: "error", evaluatorId: evaluator.id });
          return configurationBlockedResult(
            new RuleConfigurationError(`Evaluator ${evaluator.id} failed safely.`),
            trace,
          );
        }

        trace.entries.push({ decision: decision.kind, evaluatorId: evaluator.id });

        if (decision.kind === "no-match") {
          continue;
        }

        if (decision.kind === "blocked") {
          return {
            issues: uniqueStrings(decision.missingFields).map((field) => ({
              field,
              message: "Required confirmed input is missing.",
            })),
            reason: "missing-required-inputs",
            status: "blocked",
            trace,
          } satisfies BlockedRuleEvaluation;
        }

        try {
          return buildRuleResult(catalogue, assessment, decision.ruleId, decision.facts, trace);
        } catch (error: unknown) {
          return configurationBlockedResult(error, trace);
        }
      }

      try {
        return buildUnsupportedResult(catalogue, assessment, trace);
      } catch (error: unknown) {
        return configurationBlockedResult(error, trace);
      }
    },
  });
}

function validateAndSortEvaluators(evaluators: readonly RuleEvaluator[]): RuleEvaluator[] {
  const evaluatorIds = new Set<string>();

  for (const evaluator of evaluators) {
    if (evaluator.id.trim().length === 0) {
      throw new RuleConfigurationError("Rule evaluator IDs must not be blank.");
    }

    if (evaluatorIds.has(evaluator.id)) {
      throw new RuleConfigurationError(`Duplicate rule evaluator ID ${evaluator.id}.`);
    }

    if (!Number.isInteger(evaluator.order) || evaluator.order < 0) {
      throw new RuleConfigurationError(`Evaluator ${evaluator.id} must have a non-negative order.`);
    }

    if (evaluator.contexts.length === 0) {
      throw new RuleConfigurationError(
        `Evaluator ${evaluator.id} must declare a clinical context.`,
      );
    }

    evaluatorIds.add(evaluator.id);
  }

  return [...evaluators].sort(
    (left, right) => left.order - right.order || left.id.localeCompare(right.id),
  );
}

function groupEvaluatorsByContext(
  evaluators: readonly RuleEvaluator[],
): Map<ClinicalContext, RuleEvaluator[]> {
  const grouped = new Map<ClinicalContext, RuleEvaluator[]>();

  for (const evaluator of evaluators) {
    for (const context of new Set(evaluator.contexts)) {
      grouped.set(context, [...(grouped.get(context) ?? []), evaluator]);
    }
  }

  return grouped;
}

function configurationBlockedResult(
  error: unknown,
  trace: RuleEvaluationTrace,
): BlockedRuleEvaluation {
  return {
    issues: [
      {
        field: "ruleEngine",
        message:
          error instanceof RuleConfigurationError
            ? error.message
            : "Rule evaluation failed safely because of an unexpected configuration error.",
      },
    ],
    reason: "configuration-error",
    status: "blocked",
    trace,
  };
}

function uniqueStrings(values: readonly string[]): string[] {
  return [...new Set(values)].sort();
}
