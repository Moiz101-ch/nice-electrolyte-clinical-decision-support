import { z } from "zod";

import {
  niceRuleCatalogueSchema,
  resourceSearchConfigSchema,
  runtimeNiceRuleCatalogueSchema,
  runtimeResourceConfigurationSchema,
  splitCommaSeparated,
  splitSemicolonSeparated,
  type NiceRuleCatalogue,
  type ResourceSearchConfig,
  type RuntimeNiceRuleCatalogue,
  type RuntimeResourceConfiguration,
} from "./schemas.ts";

export function validateNiceRuleCatalogue(input: unknown): NiceRuleCatalogue {
  return niceRuleCatalogueSchema.parse(input);
}

export function validateResourceSearchConfiguration(input: unknown): ResourceSearchConfig {
  return resourceSearchConfigSchema.parse(input);
}

export function createRuntimeNiceRuleCatalogue(
  catalogue: NiceRuleCatalogue,
): RuntimeNiceRuleCatalogue {
  return runtimeNiceRuleCatalogueSchema.parse({
    catalogueVersion: catalogue.catalogue_version,
    checkedOn: catalogue.checked_on,
    managementSourcePolicy: catalogue.management_source_policy,
    rules: catalogue.rules.map((rule) => ({
      ruleId: rule.rule_id,
      electrolyte: rule.electrolyte,
      condition: rule.condition,
      context: rule.context,
      triggerSummary: rule.trigger_summary,
      requiredInputs: splitSemicolonSeparated(rule.required_inputs),
      outputPriority: rule.output_priority,
      outputStatus: rule.output_status,
      managementOutput: rule.management_output,
      limitations: rule.limitations,
      niceSourceIds: splitCommaSeparated(rule.nice_source_ids),
      niceSections: splitCommaSeparated(rule.nice_sections),
      activeForAutomation: rule.active_for_automation === "Yes",
      clinicianReviewStatus: rule.clinician_review_status,
    })),
    sources: catalogue.sources.map((source) => ({
      sourceId: source.source_id,
      guidanceCode: source.guidance_code,
      title: source.title,
      sourceType: source.source_type,
      publishedDate: source.published_date,
      lastUpdated: source.last_updated,
      scope: source.scope,
      relevantSections: splitCommaSeparated(source.relevant_sections),
      url: source.url,
      useInProject: source.use_in_project,
      checkedOn: source.checked_on,
    })),
  });
}

export function createRuntimeResourceConfiguration(
  resources: ResourceSearchConfig,
): RuntimeResourceConfiguration {
  return runtimeResourceConfigurationSchema.parse(
    resources.map((resource) => ({
      condition: resource.condition,
      primaryManagementSource: resource.primary_management_source,
      primarySourcePolicy: resource.primary_source_policy,
      secondarySources: ["Europe PMC", "PubMed"],
      secondarySourceLabel: resource.secondary_source_label,
      secondarySourceEffect: resource.secondary_source_effect,
      preferredPublicationTypes: splitSemicolonSeparated(resource.preferred_publication_types),
      excludedPublicationTypes: splitSemicolonSeparated(resource.excluded_publication_types),
      defaultQuery: resource.default_query,
      resultLimit: Number(resource.result_limit),
      cacheDays: Number(resource.cache_days),
    })),
  );
}

export function formatValidationError(error: z.ZodError): string {
  return error.issues
    .map((issue) => `${issue.path.length === 0 ? "root" : issue.path.join(".")}: ${issue.message}`)
    .join("\n");
}
