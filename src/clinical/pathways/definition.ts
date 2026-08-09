import { loadClinicalSourceRegistry } from "../sources/registry.ts";
import type { ClinicalSource } from "../sources/schema.ts";
import {
  getNodeSourceReferences,
  pathwayDefinitionSchema,
  type PathwayDefinition,
} from "./schema.ts";

export interface PathwaySourceRecord {
  readonly clinicalReviewStatus: ClinicalSource["clinicalReviewStatus"];
  readonly pageCount: number;
  readonly sourceId: string;
}

export interface LoadPathwayDefinitionOptions {
  readonly sources?: readonly PathwaySourceRecord[];
}

export interface PathwayDefinitionIssue {
  readonly message: string;
  readonly path: string;
}

export class PathwayDefinitionError extends Error {
  readonly issues: readonly PathwayDefinitionIssue[];

  constructor(issues: readonly PathwayDefinitionIssue[]) {
    super(issues.map((issue) => `${issue.path}: ${issue.message}`).join("\n"));
    this.name = "PathwayDefinitionError";
    this.issues = Object.freeze([...issues]);
  }
}

export function loadPathwayDefinition(
  input: unknown,
  options: LoadPathwayDefinitionOptions = {},
): PathwayDefinition {
  const parsed = pathwayDefinitionSchema.safeParse(input);

  if (!parsed.success) {
    throw new PathwayDefinitionError(
      parsed.error.issues.map((issue) => ({
        message: issue.message,
        path: issue.path.length === 0 ? "root" : issue.path.join("."),
      })),
    );
  }

  const definition = parsed.data;
  const sources = options.sources ?? loadClinicalSourceRegistry().sources;
  const sourcesById = new Map(sources.map((source) => [source.sourceId, source]));
  const issues: PathwayDefinitionIssue[] = [];

  for (const sourceId of definition.sourceIds) {
    const source = sourcesById.get(sourceId);

    if (!source) {
      issues.push({
        message: `Source ${sourceId} is not present in the clinical source registry.`,
        path: "sourceIds",
      });
      continue;
    }

    if (
      definition.status === "approved-for-project-use" &&
      source.clinicalReviewStatus !== "approved-for-project-use"
    ) {
      issues.push({
        message: `Approved pathway cannot depend on unapproved source ${sourceId}.`,
        path: "status",
      });
    }
  }

  for (const [nodeIndex, node] of definition.nodes.entries()) {
    for (const reference of getNodeSourceReferences(node)) {
      const source = sourcesById.get(reference.sourceId);

      if (source && reference.page > source.pageCount) {
        issues.push({
          message: `Page ${reference.page} exceeds the ${source.pageCount}-page source ${reference.sourceId}.`,
          path: `nodes.${nodeIndex}.sourceReferences`,
        });
      }
    }
  }

  if (issues.length > 0) {
    throw new PathwayDefinitionError(issues);
  }

  return deepFreeze(definition);
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) {
      deepFreeze(child);
    }

    Object.freeze(value);
  }

  return value;
}
