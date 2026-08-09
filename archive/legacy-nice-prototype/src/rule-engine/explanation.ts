import type { RuleDefinition } from "./catalogue.ts";
import type { DeterministicExplanation, RuleMatchFact } from "./types.ts";

export function buildDeterministicExplanation(
  rule: RuleDefinition,
  facts: readonly RuleMatchFact[],
): DeterministicExplanation {
  const stableFacts = facts.map((fact) => ({ ...fact }));
  const summary =
    rule.ruleId === "NICE-UNSUPPORTED-001"
      ? "No active NICE rule matched the confirmed assessment context. Treatment instructions were intentionally not generated."
      : stableFacts.length === 0
        ? `Matched ${rule.ruleId} using the confirmed assessment context.`
        : `Matched ${rule.ruleId} because ${stableFacts
            .map((fact) => `${fact.label}: ${formatFactValue(fact.value)}`)
            .join("; ")}.`;

  return {
    facts: stableFacts,
    summary,
    templateVersion: "1.0",
  };
}

function formatFactValue(value: RuleMatchFact["value"]): string {
  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  return String(value);
}
