import { buildDeterministicExplanation } from "./explanation.ts";
import type { RuleCatalogue, RuleDefinition } from "./catalogue.ts";
import type { ValidatedAssessment } from "./assessment.ts";
import type { RuleEvaluationTrace, RuleMatchFact, RuleResult, RuleResultSource } from "./types.ts";

export class RuleConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RuleConfigurationError";
  }
}

export function buildRuleResult(
  catalogue: RuleCatalogue,
  assessment: ValidatedAssessment,
  ruleId: string,
  facts: readonly RuleMatchFact[],
  trace: RuleEvaluationTrace,
): RuleResult {
  const rule = getActiveRule(catalogue, ruleId);
  const isUnsupported = rule.ruleId === "NICE-UNSUPPORTED-001";
  const sources = resolveSources(catalogue, rule);

  if (!isUnsupported && sources.length === 0) {
    throw new RuleConfigurationError(`Supported rule ${rule.ruleId} has no NICE source.`);
  }

  if (isUnsupported && sources.length > 0) {
    throw new RuleConfigurationError(
      "The unsupported safety rule must not provide a treatment source.",
    );
  }

  return freezeRuleResult({
    assessment: {
      clinicalContext: assessment.clinicalContext,
      condition: assessment.condition,
      electrolyte: assessment.electrolyte,
      measuredValue: assessment.measuredValue,
      unit: assessment.unit,
    },
    catalogueVersion: catalogue.catalogueVersion,
    clinicalReviewStatus: rule.clinicianReviewStatus,
    explanation: buildDeterministicExplanation(rule, facts),
    limitations: rule.limitations,
    managementOutput: rule.managementOutput,
    outputStatus: rule.outputStatus,
    priority: rule.outputPriority,
    ruleId: rule.ruleId as `NICE-${string}`,
    sources,
    status: isUnsupported ? "unsupported" : "matched",
    trace,
    triggerSummary: rule.triggerSummary,
  });
}

export function buildUnsupportedResult(
  catalogue: RuleCatalogue,
  assessment: ValidatedAssessment,
  trace: RuleEvaluationTrace,
): RuleResult {
  return buildRuleResult(
    catalogue,
    assessment,
    "NICE-UNSUPPORTED-001",
    [
      { field: "electrolyte", label: "Electrolyte", value: assessment.electrolyte },
      { field: "condition", label: "Stated condition", value: assessment.condition },
      { field: "clinicalContext", label: "Clinical context", value: assessment.clinicalContext },
    ],
    trace,
  );
}

function getActiveRule(catalogue: RuleCatalogue, ruleId: string): RuleDefinition {
  const rule = catalogue.getRule(ruleId);

  if (rule === undefined) {
    throw new RuleConfigurationError(`Rule ${ruleId} is not present in the validated catalogue.`);
  }

  if (!rule.activeForAutomation) {
    throw new RuleConfigurationError(`Rule ${ruleId} is not active for automation.`);
  }

  if (rule.clinicianReviewStatus === "Rejected") {
    throw new RuleConfigurationError(`Rule ${ruleId} was rejected during clinical review.`);
  }

  return rule;
}

function resolveSources(catalogue: RuleCatalogue, rule: RuleDefinition): RuleResultSource[] {
  return rule.niceSourceIds.map((sourceId) => {
    const source = catalogue.getSource(sourceId);

    if (source === undefined) {
      throw new RuleConfigurationError(
        `Rule ${rule.ruleId} references missing source ${sourceId}.`,
      );
    }

    return {
      checkedOn: source.checkedOn,
      guidanceCode: source.guidanceCode,
      recommendationSections: [...rule.niceSections],
      sourceId: source.sourceId,
      title: source.title,
      url: source.url,
    };
  });
}

function freezeRuleResult(result: RuleResult): RuleResult {
  Object.freeze(result.assessment);
  result.explanation.facts.forEach(Object.freeze);
  Object.freeze(result.explanation.facts);
  Object.freeze(result.explanation);
  result.sources.forEach((source) => {
    Object.freeze(source.recommendationSections);
    Object.freeze(source);
  });
  Object.freeze(result.sources);
  result.trace.entries.forEach(Object.freeze);
  Object.freeze(result.trace.entries);
  Object.freeze(result.trace);

  return Object.freeze(result);
}
