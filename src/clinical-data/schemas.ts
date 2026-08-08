import { z } from "zod";

const nonEmptyText = z.string().trim().min(1);
const nonNegativeIntegerText = z.string().trim().regex(/^\d+$/);
const positiveIntegerText = z
  .string()
  .trim()
  .regex(/^[1-9]\d*$/);

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const [year, month, day] = value.split("-").map(Number);
    const parsedDate = new Date(Date.UTC(year ?? 0, (month ?? 1) - 1, day ?? 0));

    return (
      parsedDate.getUTCFullYear() === year &&
      parsedDate.getUTCMonth() === (month ?? 1) - 1 &&
      parsedDate.getUTCDate() === day
    );
  }, "Expected a valid calendar date in YYYY-MM-DD format.");

const optionalIsoDate = z.union([z.literal(""), isoDate]);
const niceSourceId = z.string().regex(/^NICE-(?:CG|NG|TA)\d+$/);
const niceUrl = z
  .url()
  .refine(
    (value) => new URL(value).hostname.toLowerCase().endsWith("nice.org.uk"),
    "Expected a NICE URL.",
  );

export const niceRuleSchema = z.object({
  rule_id: z.string().regex(/^NICE-[A-Z0-9-]+$/),
  electrolyte: nonEmptyText,
  condition: nonEmptyText,
  context: nonEmptyText,
  trigger_summary: nonEmptyText,
  required_inputs: nonEmptyText,
  output_priority: nonEmptyText,
  output_status: nonEmptyText,
  management_output: nonEmptyText,
  limitations: nonEmptyText,
  nice_source_ids: z.string(),
  nice_sections: z.string(),
  active_for_automation: z.enum(["Yes", "No"]),
  clinician_review_status: z.enum(["Pending", "Approved", "Rejected"]),
});

export const niceSourceSchema = z
  .object({
    source_id: niceSourceId,
    guidance_code: z.string().regex(/^(?:CG|NG|TA)\d+$/),
    title: nonEmptyText,
    source_type: nonEmptyText,
    published_date: isoDate,
    last_updated: optionalIsoDate,
    scope: nonEmptyText,
    relevant_sections: nonEmptyText,
    url: niceUrl,
    use_in_project: nonEmptyText,
    checked_on: isoDate,
  })
  .superRefine((source, context) => {
    if (source.source_id !== `NICE-${source.guidance_code}`) {
      context.addIssue({
        code: "custom",
        path: ["source_id"],
        message: "Source ID must be derived from the guidance code.",
      });
    }
  });

export const niceRuleCatalogueSchema = z
  .object({
    catalogue_version: z.string().regex(/^\d+\.\d+\.\d+$/),
    checked_on: isoDate,
    management_source_policy: z.literal("NICE-only"),
    rules: z.array(niceRuleSchema).min(1),
    sources: z.array(niceSourceSchema).min(1),
  })
  .superRefine((catalogue, context) => {
    const sourceIds = new Set<string>();
    const ruleIds = new Set<string>();

    for (const [sourceIndex, source] of catalogue.sources.entries()) {
      if (sourceIds.has(source.source_id)) {
        context.addIssue({
          code: "custom",
          path: ["sources", sourceIndex, "source_id"],
          message: "Source IDs must be unique.",
        });
      }

      sourceIds.add(source.source_id);
    }

    for (const [ruleIndex, rule] of catalogue.rules.entries()) {
      if (ruleIds.has(rule.rule_id)) {
        context.addIssue({
          code: "custom",
          path: ["rules", ruleIndex, "rule_id"],
          message: "Rule IDs must be unique.",
        });
      }

      ruleIds.add(rule.rule_id);
      const referencedSourceIds = splitCommaSeparated(rule.nice_source_ids);
      const sections = splitCommaSeparated(rule.nice_sections);
      const isUnsupportedSafetyRule =
        rule.output_status === "No definitive NICE-only management output";

      if (!isUnsupportedSafetyRule && referencedSourceIds.length === 0) {
        context.addIssue({
          code: "custom",
          path: ["rules", ruleIndex, "nice_source_ids"],
          message: "Active management rules must reference at least one NICE source.",
        });
      }

      if (referencedSourceIds.length > 0 && sections.length === 0) {
        context.addIssue({
          code: "custom",
          path: ["rules", ruleIndex, "nice_sections"],
          message: "Rules with NICE sources must identify relevant NICE sections.",
        });
      }

      for (const sourceId of referencedSourceIds) {
        if (!sourceIds.has(sourceId)) {
          context.addIssue({
            code: "custom",
            path: ["rules", ruleIndex, "nice_source_ids"],
            message: `Rule references unknown NICE source ${sourceId}.`,
          });
        }
      }
    }
  });

export const resourceSearchConfigRowSchema = z.object({
  condition: nonEmptyText,
  primary_management_source: z.literal("NICE only"),
  primary_source_policy: nonEmptyText,
  secondary_sources: z.literal("Europe PMC and PubMed"),
  secondary_source_label: nonEmptyText,
  secondary_source_effect: z.literal("Must not alter the NICE-derived management result."),
  preferred_publication_types: nonEmptyText,
  excluded_publication_types: nonEmptyText,
  default_query: nonEmptyText,
  result_limit: positiveIntegerText,
  cache_days: nonNegativeIntegerText,
});

export const resourceSearchConfigSchema = z
  .array(resourceSearchConfigRowSchema)
  .min(1)
  .superRefine((resources, context) => {
    const conditions = new Set<string>();

    for (const [resourceIndex, resource] of resources.entries()) {
      if (conditions.has(resource.condition)) {
        context.addIssue({
          code: "custom",
          path: [resourceIndex, "condition"],
          message: "Resource configuration conditions must be unique.",
        });
      }

      conditions.add(resource.condition);
    }
  });

export const runtimeNiceRuleSchema = z.object({
  ruleId: z.string().regex(/^NICE-[A-Z0-9-]+$/),
  electrolyte: nonEmptyText,
  condition: nonEmptyText,
  context: nonEmptyText,
  triggerSummary: nonEmptyText,
  requiredInputs: z.array(nonEmptyText).min(1),
  outputPriority: nonEmptyText,
  outputStatus: nonEmptyText,
  managementOutput: nonEmptyText,
  limitations: nonEmptyText,
  niceSourceIds: z.array(niceSourceId),
  niceSections: z.array(nonEmptyText),
  activeForAutomation: z.boolean(),
  clinicianReviewStatus: z.enum(["Pending", "Approved", "Rejected"]),
});

export const runtimeNiceSourceSchema = z.object({
  sourceId: niceSourceId,
  guidanceCode: z.string().regex(/^(?:CG|NG|TA)\d+$/),
  title: nonEmptyText,
  sourceType: nonEmptyText,
  publishedDate: isoDate,
  lastUpdated: optionalIsoDate,
  scope: nonEmptyText,
  relevantSections: z.array(nonEmptyText).min(1),
  url: niceUrl,
  useInProject: nonEmptyText,
  checkedOn: isoDate,
});

export const runtimeNiceRuleCatalogueSchema = z.object({
  catalogueVersion: z.string().regex(/^\d+\.\d+\.\d+$/),
  checkedOn: isoDate,
  managementSourcePolicy: z.literal("NICE-only"),
  rules: z.array(runtimeNiceRuleSchema).min(1),
  sources: z.array(runtimeNiceSourceSchema).min(1),
});

export const runtimeResourceConfigSchema = z.object({
  condition: nonEmptyText,
  primaryManagementSource: z.literal("NICE only"),
  primarySourcePolicy: nonEmptyText,
  secondarySources: z.tuple([z.literal("Europe PMC"), z.literal("PubMed")]),
  secondarySourceLabel: nonEmptyText,
  secondarySourceEffect: z.literal("Must not alter the NICE-derived management result."),
  preferredPublicationTypes: z.array(nonEmptyText).min(1),
  excludedPublicationTypes: z.array(nonEmptyText).min(1),
  defaultQuery: nonEmptyText,
  resultLimit: z.number().int().positive(),
  cacheDays: z.number().int().nonnegative(),
});

export const runtimeResourceConfigurationSchema = z.array(runtimeResourceConfigSchema).min(1);

export type NiceRuleCatalogue = z.infer<typeof niceRuleCatalogueSchema>;
export type ResourceSearchConfig = z.infer<typeof resourceSearchConfigSchema>;
export type RuntimeNiceRuleCatalogue = z.infer<typeof runtimeNiceRuleCatalogueSchema>;
export type RuntimeResourceConfiguration = z.infer<typeof runtimeResourceConfigurationSchema>;

export function splitCommaSeparated(value: string): string[] {
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function splitSemicolonSeparated(value: string): string[] {
  return value
    .split(";")
    .map((entry) => entry.trim())
    .filter(Boolean);
}
