import { z } from "zod";

const nonEmptyText = z.string().trim().min(1);
const nullableNonEmptyText = nonEmptyText.nullable();

export const clinicalScopeSchema = z.enum([
  "hyponatraemia",
  "hyperkalaemia",
  "hypocalcaemia",
  "hypomagnesaemia",
  "dka",
]);

export const clinicalSourceKindSchema = z.enum([
  "clinical-pathway",
  "supporting-guidance",
  "diagram",
  "product-reference",
]);

export const clinicalReviewStatusSchema = z.enum([
  "draft",
  "awaiting-clinical-review",
  "changes-requested",
  "clinically-reviewed",
  "approved-for-project-use",
  "superseded",
]);

export const sourceDatePrecisionSchema = z.enum(["year", "month", "day"]);

export const sourceDateSchema = z
  .object({
    precision: sourceDatePrecisionSchema,
    value: z.string(),
  })
  .strict()
  .superRefine((date, context) => {
    const patterns = {
      day: /^\d{4}-\d{2}-\d{2}$/,
      month: /^\d{4}-\d{2}$/,
      year: /^\d{4}$/,
    } as const;

    if (!patterns[date.precision].test(date.value)) {
      context.addIssue({
        code: "custom",
        path: ["value"],
        message: `Date value must match ${date.precision} precision.`,
      });
      return;
    }

    const [year, month = "01", day = "01"] = date.value.split("-");
    const parsed = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));

    if (
      parsed.getUTCFullYear() !== Number(year) ||
      parsed.getUTCMonth() !== Number(month) - 1 ||
      parsed.getUTCDate() !== Number(day)
    ) {
      context.addIssue({
        code: "custom",
        path: ["value"],
        message: "Date value must be a valid calendar date.",
      });
    }
  });

export const sourceGovernanceFlagSchema = z.enum([
  "boundary-ambiguous",
  "internal-content-conflict",
  "metadata-incomplete",
  "missing-referenced-source",
  "provenance-unverified",
  "reuse-unverified",
  "review-due-soon",
  "review-overdue",
  "source-mismatch",
]);

const supportingReferenceSchema = z
  .object({
    identifier: nullableNonEmptyText,
    status: z.enum(["external-only", "not-supplied", "supplied"]),
    title: nonEmptyText,
    url: z.url().nullable(),
  })
  .strict();

const imageDimensionsSchema = z
  .object({
    height: z.number().int().positive(),
    width: z.number().int().positive(),
  })
  .strict();

export const clinicalSourceSchema = z
  .object({
    authors: z.array(nonEmptyText),
    clinicalReviewStatus: clinicalReviewStatusSchema,
    clinicalScope: clinicalScopeSchema,
    documentVersion: nullableNonEmptyText,
    fileSizeBytes: z.number().int().positive(),
    governanceFlags: z.array(sourceGovernanceFlagSchema),
    imageDimensions: imageDimensionsSchema.nullable(),
    issueDate: sourceDateSchema.nullable(),
    localPath: z
      .string()
      .regex(
        /^clinical-sources\/(?:hyponatraemia|hyperkalaemia|hypocalcaemia|hypomagnesaemia|dka|supporting)\/.+$/,
      ),
    mediaType: z.enum(["application/pdf", "image/jpeg"]),
    notes: z.array(nonEmptyText).min(1),
    organisation: nullableNonEmptyText,
    originalFileName: nonEmptyText,
    owner: nullableNonEmptyText,
    pageCount: z.number().int().positive(),
    provenanceStatus: z.enum(["identified-source", "unverified-source"]),
    relatedSourceIds: z.array(nonEmptyText),
    reviewDate: sourceDateSchema.nullable(),
    reuseStatus: z.enum([
      "approved-for-public-display",
      "internal-verification-only",
      "not-assessed",
    ]),
    sha256: z.string().regex(/^[A-F0-9]{64}$/),
    sourceId: z.string().regex(/^[A-Z0-9][A-Z0-9-]+$/),
    sourceKind: clinicalSourceKindSchema,
    supportingReferences: z.array(supportingReferenceSchema),
    title: nonEmptyText,
  })
  .strict()
  .superRefine((source, context) => {
    validateUniqueValues(source.authors, "authors", context);
    validateUniqueValues(source.governanceFlags, "governanceFlags", context);
    validateUniqueValues(source.relatedSourceIds, "relatedSourceIds", context);

    const pathFileName = source.localPath.split("/").at(-1);

    if (pathFileName !== source.originalFileName) {
      context.addIssue({
        code: "custom",
        path: ["originalFileName"],
        message: "Original filename must match the final local-path segment.",
      });
    }

    if (source.mediaType === "image/jpeg" && source.imageDimensions === null) {
      context.addIssue({
        code: "custom",
        path: ["imageDimensions"],
        message: "JPEG sources must record their original dimensions.",
      });
    }

    if (source.mediaType === "application/pdf" && source.imageDimensions !== null) {
      context.addIssue({
        code: "custom",
        path: ["imageDimensions"],
        message: "PDF sources must not define image dimensions.",
      });
    }

    if (
      source.issueDate !== null &&
      source.reviewDate !== null &&
      source.reviewDate.value < source.issueDate.value
    ) {
      context.addIssue({
        code: "custom",
        path: ["reviewDate"],
        message: "Review date must not precede the issue date.",
      });
    }

    if (source.provenanceStatus === "unverified-source") {
      if (!source.governanceFlags.includes("provenance-unverified")) {
        context.addIssue({
          code: "custom",
          path: ["governanceFlags"],
          message: "Unverified sources must carry the provenance-unverified flag.",
        });
      }

      if (source.clinicalReviewStatus !== "draft") {
        context.addIssue({
          code: "custom",
          path: ["clinicalReviewStatus"],
          message: "An unverified source must remain in draft status.",
        });
      }
    }

    if (source.reuseStatus !== "approved-for-public-display") {
      if (!source.governanceFlags.includes("reuse-unverified")) {
        context.addIssue({
          code: "custom",
          path: ["governanceFlags"],
          message: "Sources without public-display approval must carry the reuse-unverified flag.",
        });
      }
    }

    if (source.clinicalReviewStatus === "approved-for-project-use") {
      const approvalBlockingFlags = new Set([
        "boundary-ambiguous",
        "internal-content-conflict",
        "metadata-incomplete",
        "missing-referenced-source",
        "provenance-unverified",
        "review-overdue",
        "source-mismatch",
      ]);
      const presentBlockingFlags = source.governanceFlags.filter((flag) =>
        approvalBlockingFlags.has(flag),
      );

      if (
        source.organisation === null ||
        source.documentVersion === null ||
        source.issueDate === null ||
        source.reviewDate === null ||
        presentBlockingFlags.length > 0
      ) {
        context.addIssue({
          code: "custom",
          path: ["clinicalReviewStatus"],
          message: "Approved sources must have complete metadata and no approval-blocking flags.",
        });
      }
    }
  });

export const clinicalSourceRegistrySchema = z
  .object({
    auditedOn: z.iso.date(),
    registryVersion: z.string().regex(/^\d+\.\d+\.\d+$/),
    sources: z.array(clinicalSourceSchema).min(1),
  })
  .strict()
  .superRefine((registry, context) => {
    validateRegistryUniqueness(registry.sources, "sourceId", context);
    validateRegistryUniqueness(registry.sources, "localPath", context);
    validateRegistryUniqueness(registry.sources, "sha256", context);

    const sourceIds = new Set(registry.sources.map((source) => source.sourceId));

    for (const [sourceIndex, source] of registry.sources.entries()) {
      for (const relatedSourceId of source.relatedSourceIds) {
        if (!sourceIds.has(relatedSourceId)) {
          context.addIssue({
            code: "custom",
            path: ["sources", sourceIndex, "relatedSourceIds"],
            message: `Related source ${relatedSourceId} is not in the registry.`,
          });
        }
      }
    }
  });

export type ClinicalScope = z.infer<typeof clinicalScopeSchema>;
export type ClinicalSource = z.infer<typeof clinicalSourceSchema>;
export type ClinicalSourceRegistryData = z.infer<typeof clinicalSourceRegistrySchema>;
export type SourceDate = z.infer<typeof sourceDateSchema>;

function validateUniqueValues(
  values: readonly string[],
  field: string,
  context: z.RefinementCtx,
): void {
  if (new Set(values).size !== values.length) {
    context.addIssue({
      code: "custom",
      path: [field],
      message: `${field} values must be unique.`,
    });
  }
}

function validateRegistryUniqueness(
  sources: readonly ClinicalSource[],
  field: "sourceId" | "localPath" | "sha256",
  context: z.RefinementCtx,
): void {
  const values = new Set<string>();

  for (const [sourceIndex, source] of sources.entries()) {
    if (values.has(source[field])) {
      context.addIssue({
        code: "custom",
        path: ["sources", sourceIndex, field],
        message: `${field} values must be unique.`,
      });
    }

    values.add(source[field]);
  }
}
