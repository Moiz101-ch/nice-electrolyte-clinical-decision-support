import { z } from "zod";

import { clinicalReviewStatusSchema } from "../sources/schema.ts";

const nonEmptyText = z.string().trim().min(1);

export const pathwayIdSchema = z
  .string()
  .regex(/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/, "Use a lowercase kebab-case pathway ID.");

export const pathwayNodeIdSchema = z
  .string()
  .regex(/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/, "Use a lowercase kebab-case node ID.");

export const pathwayDataKeySchema = z
  .string()
  .regex(
    /^[a-z][A-Za-z0-9]*(?:\.[a-z][A-Za-z0-9]*)*$/,
    "Use a camelCase data key, optionally separated by dots.",
  );

export const pathwayVersionSchema = z
  .string()
  .regex(/^\d+\.\d+\.\d+$/, "Pathway versions must use semantic versioning.");

export const pathwaySourceReferenceSchema = z
  .object({
    page: z.number().int().positive(),
    section: nonEmptyText,
    sourceId: z.string().regex(/^[A-Z0-9][A-Z0-9-]+$/),
  })
  .strict();

const sourceReferencesSchema = z.array(pathwaySourceReferenceSchema).min(1);

export const pathwayReviewMetadataSchema = z
  .object({
    approvedBy: nonEmptyText.nullable(),
    approvedOn: z.iso.date().nullable(),
    notes: z.array(nonEmptyText),
    reviewedBy: nonEmptyText.nullable(),
    reviewedOn: z.iso.date().nullable(),
    status: clinicalReviewStatusSchema,
  })
  .strict()
  .superRefine((review, context) => {
    const hasReviewRecord = review.reviewedBy !== null && review.reviewedOn !== null;

    if ((review.reviewedBy === null) !== (review.reviewedOn === null)) {
      context.addIssue({
        code: "custom",
        message: "Reviewer and review date must be recorded together.",
      });
    }

    if ((review.approvedBy === null) !== (review.approvedOn === null)) {
      context.addIssue({
        code: "custom",
        message: "Approver and approval date must be recorded together.",
      });
    }

    if (
      ["clinically-reviewed", "approved-for-project-use"].includes(review.status) &&
      !hasReviewRecord
    ) {
      context.addIssue({
        code: "custom",
        message: `${review.status} pathways require reviewer and review-date metadata.`,
      });
    }

    if (
      review.status === "approved-for-project-use" &&
      (review.approvedBy === null || review.approvedOn === null)
    ) {
      context.addIssue({
        code: "custom",
        message: "Approved pathways require approver and approval-date metadata.",
      });
    }

    if (review.approvedOn !== null && review.reviewedOn === null) {
      context.addIssue({
        code: "custom",
        path: ["approvedOn"],
        message: "An approval date requires a recorded clinical review date.",
      });
    }

    if (
      review.approvedOn !== null &&
      review.reviewedOn !== null &&
      review.approvedOn < review.reviewedOn
    ) {
      context.addIssue({
        code: "custom",
        path: ["approvedOn"],
        message: "Approval cannot predate clinical review.",
      });
    }
  });

export const numericRangeSchema = z
  .object({
    maximum: z.number().finite().nullable(),
    maximumInclusive: z.boolean(),
    minimum: z.number().finite().nullable(),
    minimumInclusive: z.boolean(),
  })
  .strict()
  .superRefine((range, context) => {
    if (range.minimum === null && range.minimumInclusive) {
      context.addIssue({
        code: "custom",
        path: ["minimumInclusive"],
        message: "An unbounded minimum cannot be inclusive.",
      });
    }

    if (range.maximum === null && range.maximumInclusive) {
      context.addIssue({
        code: "custom",
        path: ["maximumInclusive"],
        message: "An unbounded maximum cannot be inclusive.",
      });
    }

    if (range.minimum === null || range.maximum === null) {
      return;
    }

    if (range.minimum > range.maximum) {
      context.addIssue({
        code: "custom",
        message: "A numeric range minimum cannot exceed its maximum.",
      });
    }

    if (range.minimum === range.maximum && (!range.minimumInclusive || !range.maximumInclusive)) {
      context.addIssue({
        code: "custom",
        message: "A single-value range must include both boundaries.",
      });
    }
  });

const commonNodeFields = {
  id: pathwayNodeIdSchema,
  sourceReferences: sourceReferencesSchema,
  title: nonEmptyText,
};

const branchTargetSchema = z
  .object({
    branchId: pathwayNodeIdSchema,
    label: nonEmptyText,
    nextNodeId: pathwayNodeIdSchema,
  })
  .strict();

const informationNodeSchema = z
  .object({
    ...commonNodeFields,
    body: nonEmptyText,
    nextNodeId: pathwayNodeIdSchema,
    type: z.literal("information"),
  })
  .strict();

const singleChoiceOptionSchema = z
  .object({
    label: nonEmptyText,
    nextNodeId: pathwayNodeIdSchema,
    optionId: pathwayNodeIdSchema,
    value: nonEmptyText,
  })
  .strict();

const singleChoiceQuestionNodeSchema = z
  .object({
    ...commonNodeFields,
    inputKey: pathwayDataKeySchema,
    options: z.array(singleChoiceOptionSchema).min(2),
    prompt: nonEmptyText,
    type: z.literal("single-choice-question"),
  })
  .strict()
  .superRefine((node, context) => {
    validateUnique(
      node.options.map((option) => option.optionId),
      "option ID",
      context,
    );
    validateUnique(
      node.options.map((option) => option.value),
      "option value",
      context,
    );
  });

const multiSelectOptionSchema = z
  .object({
    label: nonEmptyText,
    optionId: pathwayNodeIdSchema,
    value: nonEmptyText,
  })
  .strict();

const multiSelectBranchSchema = branchTargetSchema.extend({
  operator: z.enum(["contains-all", "contains-any", "contains-none"]),
  values: z.array(nonEmptyText).min(1),
});

const multiSelectQuestionNodeSchema = z
  .object({
    ...commonNodeFields,
    branches: z.array(multiSelectBranchSchema).min(1),
    fallbackBranch: branchTargetSchema.nullable(),
    inputKey: pathwayDataKeySchema,
    maximumSelections: z.number().int().nonnegative(),
    minimumSelections: z.number().int().nonnegative(),
    options: z.array(multiSelectOptionSchema).min(1),
    prompt: nonEmptyText,
    type: z.literal("multi-select-question"),
  })
  .strict()
  .superRefine((node, context) => {
    if (node.maximumSelections < node.minimumSelections) {
      context.addIssue({
        code: "custom",
        path: ["maximumSelections"],
        message: "Maximum selections cannot be lower than minimum selections.",
      });
    }

    if (node.maximumSelections > node.options.length) {
      context.addIssue({
        code: "custom",
        path: ["maximumSelections"],
        message: "Maximum selections cannot exceed the available options.",
      });
    }

    const optionValues = node.options.map((option) => option.value);
    validateUnique(
      node.options.map((option) => option.optionId),
      "option ID",
      context,
    );
    validateUnique(optionValues, "option value", context);
    validateUnique(
      [
        ...node.branches.map((branch) => branch.branchId),
        ...(node.fallbackBranch === null ? [] : [node.fallbackBranch.branchId]),
      ],
      "branch ID",
      context,
    );

    for (const [branchIndex, branch] of node.branches.entries()) {
      validateUnique(branch.values, "branch option value", context, ["branches", branchIndex]);

      for (const value of branch.values) {
        if (!optionValues.includes(value)) {
          context.addIssue({
            code: "custom",
            path: ["branches", branchIndex, "values"],
            message: `Branch value ${value} is not a declared option.`,
          });
        }
      }
    }
  });

const numericInputNodeSchema = z
  .object({
    ...commonNodeFields,
    acceptedRange: numericRangeSchema,
    inputKey: pathwayDataKeySchema,
    nextNodeId: pathwayNodeIdSchema,
    precision: z.number().int().min(0).max(8),
    prompt: nonEmptyText,
    type: z.literal("numeric-input"),
    unit: nonEmptyText,
  })
  .strict();

const numericBranchSchema = branchTargetSchema.extend({
  range: numericRangeSchema,
});

const numericBranchNodeSchema = z
  .object({
    ...commonNodeFields,
    branches: z.array(numericBranchSchema).min(1),
    inputKey: pathwayDataKeySchema,
    noMatchBranch: branchTargetSchema.nullable(),
    type: z.literal("numeric-branch"),
    unit: nonEmptyText,
  })
  .strict()
  .superRefine((node, context) => {
    validateUnique(
      [
        ...node.branches.map((branch) => branch.branchId),
        ...(node.noMatchBranch === null ? [] : [node.noMatchBranch.branchId]),
      ],
      "branch ID",
      context,
    );
    validateNonOverlappingRanges(node.branches, context);
  });

const booleanBranchNodeSchema = z
  .object({
    ...commonNodeFields,
    falseBranch: branchTargetSchema,
    inputKey: pathwayDataKeySchema,
    prompt: nonEmptyText,
    trueBranch: branchTargetSchema,
    type: z.literal("boolean-branch"),
  })
  .strict()
  .superRefine((node, context) => {
    validateUnique([node.trueBranch.branchId, node.falseBranch.branchId], "branch ID", context);
  });

const actionItemSchema = z
  .object({
    actionId: pathwayNodeIdSchema,
    instruction: nonEmptyText,
    sourceReferences: sourceReferencesSchema,
    timing: z.enum(["immediate", "next"]),
  })
  .strict();

const actionGroupNodeSchema = z
  .object({
    ...commonNodeFields,
    actions: z.array(actionItemSchema).min(1),
    nextNodeId: pathwayNodeIdSchema,
    type: z.literal("action-group"),
  })
  .strict()
  .superRefine((node, context) => {
    validateUnique(
      node.actions.map((action) => action.actionId),
      "action ID",
      context,
    );
  });

const warningItemSchema = z
  .object({
    message: nonEmptyText,
    severity: z.enum(["information", "caution", "critical"]),
    sourceReferences: sourceReferencesSchema,
    warningId: pathwayNodeIdSchema,
  })
  .strict();

const warningNodeSchema = z
  .object({
    ...commonNodeFields,
    nextNodeId: pathwayNodeIdSchema,
    type: z.literal("warning"),
    warnings: z.array(warningItemSchema).min(1),
  })
  .strict()
  .superRefine((node, context) => {
    validateUnique(
      node.warnings.map((warning) => warning.warningId),
      "warning ID",
      context,
    );
  });

const monitoringItemSchema = z
  .object({
    instruction: nonEmptyText,
    monitoringId: pathwayNodeIdSchema,
    sourceReferences: sourceReferencesSchema,
  })
  .strict();

const monitoringNodeSchema = z
  .object({
    ...commonNodeFields,
    items: z.array(monitoringItemSchema).min(1),
    nextNodeId: pathwayNodeIdSchema,
    type: z.literal("monitoring"),
  })
  .strict()
  .superRefine((node, context) => {
    validateUnique(
      node.items.map((item) => item.monitoringId),
      "monitoring ID",
      context,
    );
  });

const escalationItemSchema = z
  .object({
    escalationId: pathwayNodeIdSchema,
    instruction: nonEmptyText,
    sourceReferences: sourceReferencesSchema,
    urgency: z.enum(["routine", "urgent", "immediate"]),
  })
  .strict();

const escalationNodeSchema = z
  .object({
    ...commonNodeFields,
    items: z.array(escalationItemSchema).min(1),
    nextNodeId: pathwayNodeIdSchema,
    type: z.literal("escalation"),
  })
  .strict()
  .superRefine((node, context) => {
    validateUnique(
      node.items.map((item) => item.escalationId),
      "escalation ID",
      context,
    );
  });

const calculationOperandSchema = z.discriminatedUnion("kind", [
  z
    .object({
      kind: z.literal("constant"),
      value: z.number().finite(),
    })
    .strict(),
  z
    .object({
      key: pathwayDataKeySchema,
      kind: z.enum(["derived-value", "numeric-input"]),
    })
    .strict(),
]);

const calculationNodeSchema = z
  .object({
    ...commonNodeFields,
    nextNodeId: pathwayNodeIdSchema,
    operands: z.array(calculationOperandSchema).min(2),
    operation: z.enum(["add", "divide", "maximum", "minimum", "multiply", "subtract"]),
    outputKey: pathwayDataKeySchema,
    precision: z.number().int().min(0).max(8),
    roundingMode: z.enum(["ceiling", "floor", "half-away-from-zero"]),
    type: z.literal("calculation"),
    unit: nonEmptyText,
  })
  .strict();

const stopNodeSchema = z
  .object({
    ...commonNodeFields,
    outcome: z.enum(["completed", "requires-clinical-review", "unsupported"]),
    reason: nonEmptyText,
    type: z.literal("stop"),
  })
  .strict();

export const pathwayNodeSchema = z.discriminatedUnion("type", [
  informationNodeSchema,
  singleChoiceQuestionNodeSchema,
  multiSelectQuestionNodeSchema,
  numericInputNodeSchema,
  numericBranchNodeSchema,
  booleanBranchNodeSchema,
  actionGroupNodeSchema,
  warningNodeSchema,
  monitoringNodeSchema,
  escalationNodeSchema,
  calculationNodeSchema,
  stopNodeSchema,
]);

export const pathwayDefinitionSchema = z
  .object({
    entryNodeId: pathwayNodeIdSchema,
    name: nonEmptyText,
    nodes: z.array(pathwayNodeSchema).min(1),
    pathwayId: pathwayIdSchema,
    reviewMetadata: pathwayReviewMetadataSchema,
    sourceIds: z.array(z.string().regex(/^[A-Z0-9][A-Z0-9-]+$/)).min(1),
    status: clinicalReviewStatusSchema,
    version: pathwayVersionSchema,
  })
  .strict()
  .superRefine((definition, context) => {
    validateUnique(definition.sourceIds, "source ID", context, ["sourceIds"]);
    validateUnique(
      definition.nodes.map((node) => node.id),
      "node ID",
      context,
      ["nodes"],
    );

    if (definition.status !== definition.reviewMetadata.status) {
      context.addIssue({
        code: "custom",
        path: ["reviewMetadata", "status"],
        message: "Pathway and review-metadata statuses must match.",
      });
    }

    const nodeIds = new Set(definition.nodes.map((node) => node.id));

    if (!nodeIds.has(definition.entryNodeId)) {
      context.addIssue({
        code: "custom",
        path: ["entryNodeId"],
        message: "Entry node does not exist in the pathway graph.",
      });
    }

    if (!definition.nodes.some((node) => node.type === "stop")) {
      context.addIssue({
        code: "custom",
        path: ["nodes"],
        message: "A pathway must contain at least one explicit stop state.",
      });
    }

    const inputNodes = definition.nodes.filter(
      (node) =>
        node.type === "boolean-branch" ||
        node.type === "multi-select-question" ||
        node.type === "numeric-input" ||
        node.type === "single-choice-question",
    );
    const numericInputNodes = definition.nodes.filter((node) => node.type === "numeric-input");
    const calculationNodes = definition.nodes.filter((node) => node.type === "calculation");
    const numericInputs = new Map(numericInputNodes.map((node) => [node.inputKey, node.unit]));
    const calculationOutputs = new Map(calculationNodes.map((node) => [node.outputKey, node.unit]));

    validateUnique(
      numericInputNodes.map((node) => node.inputKey),
      "numeric input key",
      context,
      ["nodes"],
    );
    validateUnique(
      calculationNodes.map((node) => node.outputKey),
      "calculation output key",
      context,
      ["nodes"],
    );

    for (const calculation of calculationNodes) {
      if (inputNodes.some((node) => node.inputKey === calculation.outputKey)) {
        context.addIssue({
          code: "custom",
          path: ["nodes"],
          message: `Calculation output ${calculation.outputKey} conflicts with an input key.`,
        });
      }
    }

    for (const [nodeIndex, node] of definition.nodes.entries()) {
      for (const targetId of getNodeTargetIds(node)) {
        if (!nodeIds.has(targetId)) {
          context.addIssue({
            code: "custom",
            path: ["nodes", nodeIndex],
            message: `Node ${node.id} references missing node ${targetId}.`,
          });
        }
      }

      for (const reference of getNodeSourceReferences(node)) {
        if (!definition.sourceIds.includes(reference.sourceId)) {
          context.addIssue({
            code: "custom",
            path: ["nodes", nodeIndex, "sourceReferences"],
            message: `Node ${node.id} uses undeclared source ${reference.sourceId}.`,
          });
        }
      }

      if (node.type === "numeric-branch") {
        const inputUnit = numericInputs.get(node.inputKey) ?? calculationOutputs.get(node.inputKey);

        if (inputUnit === undefined) {
          context.addIssue({
            code: "custom",
            path: ["nodes", nodeIndex, "inputKey"],
            message: `Numeric branch input ${node.inputKey} has no numeric producer.`,
          });
        } else if (inputUnit !== undefined && inputUnit !== node.unit) {
          context.addIssue({
            code: "custom",
            path: ["nodes", nodeIndex, "unit"],
            message: `Numeric branch unit ${node.unit} does not match input unit ${inputUnit}.`,
          });
        }
      }

      if (node.type === "calculation") {
        for (const [operandIndex, operand] of node.operands.entries()) {
          if (operand.kind === "constant") {
            continue;
          }

          const producerExists =
            operand.kind === "numeric-input"
              ? numericInputs.has(operand.key)
              : calculationOutputs.has(operand.key);

          if (!producerExists) {
            context.addIssue({
              code: "custom",
              path: ["nodes", nodeIndex, "operands", operandIndex, "key"],
              message: `Calculation operand ${operand.key} has no ${operand.kind} producer.`,
            });
          }
        }
      }
    }

    const reachableNodeIds = collectReachableNodeIds(definition.entryNodeId, definition.nodes);

    for (const [nodeIndex, node] of definition.nodes.entries()) {
      if (!reachableNodeIds.has(node.id)) {
        context.addIssue({
          code: "custom",
          path: ["nodes", nodeIndex],
          message: `Node ${node.id} is unreachable from the entry node.`,
        });
      }
    }
  });

export type PathwayDefinition = z.infer<typeof pathwayDefinitionSchema>;
export type PathwayNode = z.infer<typeof pathwayNodeSchema>;
export type PathwaySourceReference = z.infer<typeof pathwaySourceReferenceSchema>;
export type NumericRange = z.infer<typeof numericRangeSchema>;

function validateUnique(
  values: readonly string[],
  label: string,
  context: z.RefinementCtx,
  path: Array<number | string> = [],
): void {
  const duplicates = values.filter((value, index) => values.indexOf(value) !== index);

  if (duplicates.length > 0) {
    context.addIssue({
      code: "custom",
      path,
      message: `Duplicate ${label}: ${[...new Set(duplicates)].join(", ")}.`,
    });
  }
}

function validateNonOverlappingRanges(
  branches: readonly z.infer<typeof numericBranchSchema>[],
  context: z.RefinementCtx,
): void {
  const sortedBranches = [...branches].sort((left, right) => {
    if (left.range.minimum === right.range.minimum) {
      return left.range.minimumInclusive === right.range.minimumInclusive
        ? 0
        : left.range.minimumInclusive
          ? -1
          : 1;
    }

    if (left.range.minimum === null) return -1;
    if (right.range.minimum === null) return 1;
    return left.range.minimum - right.range.minimum;
  });

  for (let index = 1; index < sortedBranches.length; index += 1) {
    const previous = sortedBranches[index - 1];
    const current = sortedBranches[index];

    if (previous && current && rangesOverlap(previous.range, current.range)) {
      context.addIssue({
        code: "custom",
        path: ["branches"],
        message: `Numeric branches ${previous.branchId} and ${current.branchId} overlap.`,
      });
    }
  }
}

function rangesOverlap(left: NumericRange, right: NumericRange): boolean {
  if (left.maximum === null || right.minimum === null) {
    return true;
  }

  if (left.maximum > right.minimum) {
    return true;
  }

  return left.maximum === right.minimum && left.maximumInclusive && right.minimumInclusive;
}

export function getNodeTargetIds(node: PathwayNode): string[] {
  switch (node.type) {
    case "single-choice-question":
      return node.options.map((option) => option.nextNodeId);
    case "multi-select-question":
      return [
        ...node.branches.map((branch) => branch.nextNodeId),
        ...(node.fallbackBranch === null ? [] : [node.fallbackBranch.nextNodeId]),
      ];
    case "numeric-branch":
      return [
        ...node.branches.map((branch) => branch.nextNodeId),
        ...(node.noMatchBranch === null ? [] : [node.noMatchBranch.nextNodeId]),
      ];
    case "boolean-branch":
      return [node.trueBranch.nextNodeId, node.falseBranch.nextNodeId];
    case "stop":
      return [];
    default:
      return [node.nextNodeId];
  }
}

export function getNodeSourceReferences(node: PathwayNode): PathwaySourceReference[] {
  switch (node.type) {
    case "action-group":
      return [
        ...node.sourceReferences,
        ...node.actions.flatMap((action) => action.sourceReferences),
      ];
    case "warning":
      return [
        ...node.sourceReferences,
        ...node.warnings.flatMap((warning) => warning.sourceReferences),
      ];
    case "monitoring":
    case "escalation":
      return [...node.sourceReferences, ...node.items.flatMap((item) => item.sourceReferences)];
    default:
      return [...node.sourceReferences];
  }
}

function collectReachableNodeIds(entryNodeId: string, nodes: readonly PathwayNode[]): Set<string> {
  const nodesById = new Map(nodes.map((node) => [node.id, node]));
  const reachable = new Set<string>();
  const pending = [entryNodeId];

  while (pending.length > 0) {
    const nodeId = pending.pop();

    if (nodeId === undefined || reachable.has(nodeId)) {
      continue;
    }

    reachable.add(nodeId);
    const node = nodesById.get(nodeId);

    if (node) {
      pending.push(...getNodeTargetIds(node));
    }
  }

  return reachable;
}
