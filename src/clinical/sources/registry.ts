import sourceRegistryJson from "./clinical-source-registry.json" with { type: "json" };

import {
  clinicalSourceRegistrySchema,
  type ClinicalScope,
  type ClinicalSource,
  type SourceDate,
} from "./schema.ts";

export type SourceCurrentness =
  "review-due-soon" | "review-overdue" | "unknown" | "within-review-window";

export interface ClinicalSourceRegistry {
  readonly auditedOn: string;
  readonly registryVersion: string;
  readonly sources: readonly Readonly<ClinicalSource>[];
  getSource: (sourceId: string) => Readonly<ClinicalSource> | undefined;
  getSourcesForScope: (scope: ClinicalScope) => readonly Readonly<ClinicalSource>[];
}

export function loadClinicalSourceRegistry(
  input: unknown = sourceRegistryJson,
): ClinicalSourceRegistry {
  const parsed = clinicalSourceRegistrySchema.parse(input);
  const sources = parsed.sources.map(freezeSource);
  const sourcesById = new Map(sources.map((source) => [source.sourceId, source]));
  const sourcesByScope = new Map<ClinicalScope, readonly Readonly<ClinicalSource>[]>();

  for (const source of sources) {
    sourcesByScope.set(source.clinicalScope, [
      ...(sourcesByScope.get(source.clinicalScope) ?? []),
      source,
    ]);
  }

  for (const [scope, scopedSources] of sourcesByScope) {
    sourcesByScope.set(scope, Object.freeze(scopedSources));
  }

  return Object.freeze({
    auditedOn: parsed.auditedOn,
    getSource: (sourceId: string) => sourcesById.get(sourceId),
    getSourcesForScope: (scope: ClinicalScope) => sourcesByScope.get(scope) ?? [],
    registryVersion: parsed.registryVersion,
    sources: Object.freeze(sources),
  });
}

export function getSourceCurrentness(
  source: Pick<ClinicalSource, "reviewDate">,
  asOf: string,
  dueSoonDays = 183,
): SourceCurrentness {
  if (source.reviewDate === null) {
    return "unknown";
  }

  const reviewBoundary = sourceDateToReviewBoundary(source.reviewDate);
  const auditDate = new Date(`${asOf}T00:00:00.000Z`);
  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  const daysRemaining = Math.floor(
    (reviewBoundary.getTime() - auditDate.getTime()) / millisecondsPerDay,
  );

  if (daysRemaining < 0) {
    return "review-overdue";
  }

  return daysRemaining <= dueSoonDays ? "review-due-soon" : "within-review-window";
}

function freezeSource(source: ClinicalSource): Readonly<ClinicalSource> {
  if (source.issueDate) {
    Object.freeze(source.issueDate);
  }

  if (source.reviewDate) {
    Object.freeze(source.reviewDate);
  }

  if (source.imageDimensions) {
    Object.freeze(source.imageDimensions);
  }

  source.supportingReferences.forEach(Object.freeze);
  Object.freeze(source.authors);
  Object.freeze(source.governanceFlags);
  Object.freeze(source.relatedSourceIds);
  Object.freeze(source.supportingReferences);
  Object.freeze(source.notes);

  return Object.freeze(source);
}

function sourceDateToReviewBoundary(sourceDate: SourceDate): Date {
  const [yearText, monthText, dayText] = sourceDate.value.split("-");
  const year = Number(yearText);

  if (sourceDate.precision === "year") {
    return new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));
  }

  const month = Number(monthText);

  if (sourceDate.precision === "month") {
    return new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
  }

  return new Date(Date.UTC(year, month - 1, Number(dayText), 23, 59, 59, 999));
}
