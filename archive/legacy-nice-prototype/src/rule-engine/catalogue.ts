import runtimeCatalogueJson from "../../data/runtime/nice-rule-catalogue.json" with { type: "json" };

import {
  runtimeNiceRuleCatalogueSchema,
  type RuntimeNiceRuleCatalogue,
} from "../clinical-data/schemas.ts";

type RuntimeRule = RuntimeNiceRuleCatalogue["rules"][number];
type RuntimeSource = RuntimeNiceRuleCatalogue["sources"][number];

export type RuleDefinition = Readonly<
  Omit<RuntimeRule, "niceSections" | "niceSourceIds" | "requiredInputs"> & {
    niceSections: readonly string[];
    niceSourceIds: readonly string[];
    requiredInputs: readonly string[];
  }
>;

export type NiceSourceDefinition = Readonly<
  Omit<RuntimeSource, "relevantSections"> & {
    relevantSections: readonly string[];
  }
>;

export interface RuleCatalogue {
  catalogueVersion: string;
  checkedOn: string;
  getRule: (ruleId: string) => RuleDefinition | undefined;
  getSource: (sourceId: string) => NiceSourceDefinition | undefined;
  managementSourcePolicy: "NICE-only";
  rules: readonly RuleDefinition[];
  sources: readonly NiceSourceDefinition[];
}

export function loadRuleCatalogue(input: unknown = runtimeCatalogueJson): RuleCatalogue {
  const parsed = runtimeNiceRuleCatalogueSchema.parse(input);
  const rules: RuleDefinition[] = parsed.rules.map((rule) =>
    Object.freeze({
      ...rule,
      niceSections: Object.freeze([...rule.niceSections]),
      niceSourceIds: Object.freeze([...rule.niceSourceIds]),
      requiredInputs: Object.freeze([...rule.requiredInputs]),
    }),
  );
  const sources: NiceSourceDefinition[] = parsed.sources.map((source) =>
    Object.freeze({
      ...source,
      relevantSections: Object.freeze([...source.relevantSections]),
    }),
  );
  const rulesById = new Map(rules.map((rule) => [rule.ruleId, rule]));
  const sourcesById = new Map(sources.map((source) => [source.sourceId, source]));

  return Object.freeze({
    catalogueVersion: parsed.catalogueVersion,
    checkedOn: parsed.checkedOn,
    getRule: (ruleId: string) => rulesById.get(ruleId),
    getSource: (sourceId: string) => sourcesById.get(sourceId),
    managementSourcePolicy: parsed.managementSourcePolicy,
    rules: Object.freeze(rules),
    sources: Object.freeze(sources),
  });
}
