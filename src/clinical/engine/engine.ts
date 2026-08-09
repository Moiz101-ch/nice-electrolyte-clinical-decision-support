import {
  loadPathwayDefinition,
  type LoadPathwayDefinitionOptions,
} from "../pathways/definition.ts";
import {
  getNodeSourceReferences,
  type NumericRange,
  type PathwayDefinition,
  type PathwayNode,
  type PathwaySourceReference,
} from "../pathways/schema.ts";
import {
  pathwayEvaluationRequestSchema,
  type PathwayAction,
  type PathwayBlockReason,
  type PathwayCurrentNode,
  type PathwayDerivedClassification,
  type PathwayDerivedValue,
  type PathwayEngine,
  type PathwayEscalation,
  type PathwayEvaluationIssue,
  type PathwayEvaluationSnapshot,
  type PathwayEvaluationStatus,
  type PathwayInformationItem,
  type PathwayInputDatum,
  type PathwayMonitoringItem,
  type PathwaySelectedBranch,
  type PathwayTraceEntry,
  type PathwayWarning,
} from "./types.ts";

interface MutableEvaluationState {
  blockReason: PathwayBlockReason | null;
  confirmedInputs: Record<string, PathwayInputDatum>;
  currentNode: PathwayCurrentNode | null;
  derivedClassifications: PathwayDerivedClassification[];
  derivedValues: Record<string, PathwayDerivedValue>;
  escalations: PathwayEscalation[];
  immediateActions: PathwayAction[];
  information: PathwayInformationItem[];
  issues: PathwayEvaluationIssue[];
  monitoring: PathwayMonitoringItem[];
  nextActions: PathwayAction[];
  selectedBranches: PathwaySelectedBranch[];
  sourceReferences: PathwaySourceReference[];
  status: PathwayEvaluationStatus;
  stopReason: string | null;
  trace: PathwayTraceEntry[];
  warnings: PathwayWarning[];
}

export function createPathwayEngine(
  definitionInput: unknown,
  options: LoadPathwayDefinitionOptions = {},
): PathwayEngine {
  const definition = loadPathwayDefinition(definitionInput, options);
  const nodesById = new Map(definition.nodes.map((node) => [node.id, node]));

  return Object.freeze({
    definition,
    evaluate: (request: unknown) => evaluatePathway(definition, nodesById, request),
  });
}

function evaluatePathway(
  definition: PathwayDefinition,
  nodesById: ReadonlyMap<string, PathwayNode>,
  requestInput: unknown,
): PathwayEvaluationSnapshot {
  const state = createInitialState(definition, nodesById);
  const parsedRequest = pathwayEvaluationRequestSchema.safeParse(requestInput);

  if (!parsedRequest.success) {
    state.status = "blocked";
    state.blockReason = "invalid-request";
    state.issues = parsedRequest.error.issues.map((issue) => ({
      field: issue.path.length === 0 ? "root" : issue.path.join("."),
      message: issue.message,
    }));
    return buildSnapshot(definition, state);
  }

  const request = parsedRequest.data;
  const visitedNodeIds = new Set<string>();
  let currentNodeId = definition.entryNodeId;

  while (true) {
    const node = nodesById.get(currentNodeId);

    if (!node) {
      return block(
        definition,
        state,
        "missing-required-input",
        "pathway",
        `Node ${currentNodeId} is unavailable.`,
      );
    }

    state.currentNode = toCurrentNode(node);

    if (visitedNodeIds.has(node.id)) {
      state.trace.push(traceEntry(node, "blocked"));
      return block(
        definition,
        state,
        "cycle-detected",
        "pathway",
        `Pathway cycle detected at node ${node.id}.`,
      );
    }

    visitedNodeIds.add(node.id);
    addSourceReferences(state, getNodeSourceReferences(node));

    switch (node.type) {
      case "information":
        state.information.push({
          body: node.body,
          nodeId: node.id,
          sourceReferences: node.sourceReferences,
          title: node.title,
        });
        state.trace.push(traceEntry(node, "advanced", node.nextNodeId));
        currentNodeId = node.nextNodeId;
        break;

      case "numeric-input": {
        const input = request.inputs[node.inputKey];

        if (input === undefined) {
          state.status = "awaiting-input";
          state.trace.push(traceEntry(node, "awaiting-input"));
          return buildSnapshot(definition, state);
        }

        if (input.kind !== "numeric") {
          state.trace.push(traceEntry(node, "blocked"));
          return invalidInput(definition, state, node.inputKey, "Expected a numeric input.");
        }

        if (input.unit !== node.unit) {
          state.trace.push(traceEntry(node, "blocked"));
          return invalidInput(
            definition,
            state,
            node.inputKey,
            `Expected unit ${node.unit}; received ${input.unit}.`,
          );
        }

        if (!valueIsInRange(input.value, node.acceptedRange)) {
          state.trace.push(traceEntry(node, "blocked"));
          return invalidInput(
            definition,
            state,
            node.inputKey,
            "Numeric input is outside the declared accepted range.",
          );
        }

        if (!hasAllowedPrecision(input.value, node.precision)) {
          state.trace.push(traceEntry(node, "blocked"));
          return invalidInput(
            definition,
            state,
            node.inputKey,
            `Numeric input exceeds ${node.precision} decimal places.`,
          );
        }

        state.confirmedInputs[node.inputKey] = input;
        state.trace.push(traceEntry(node, "advanced", node.nextNodeId));
        currentNodeId = node.nextNodeId;
        break;
      }

      case "single-choice-question": {
        const input = request.inputs[node.inputKey];

        if (input === undefined) {
          state.status = "awaiting-input";
          state.trace.push(traceEntry(node, "awaiting-input"));
          return buildSnapshot(definition, state);
        }

        if (input.kind !== "single-choice") {
          state.trace.push(traceEntry(node, "blocked"));
          return invalidInput(definition, state, node.inputKey, "Expected one selected option.");
        }

        const option = node.options.find((candidate) => candidate.value === input.value);

        if (!option) {
          state.trace.push(traceEntry(node, "blocked"));
          return invalidInput(definition, state, node.inputKey, "Selected option is not declared.");
        }

        state.confirmedInputs[node.inputKey] = input;
        addSelectedBranch(state, node.id, option.optionId, option.label);
        state.trace.push(traceEntry(node, "branched", option.nextNodeId, option.optionId));
        currentNodeId = option.nextNodeId;
        break;
      }

      case "multi-select-question": {
        const input = request.inputs[node.inputKey];

        if (input === undefined) {
          state.status = "awaiting-input";
          state.trace.push(traceEntry(node, "awaiting-input"));
          return buildSnapshot(definition, state);
        }

        if (input.kind !== "multi-select") {
          state.trace.push(traceEntry(node, "blocked"));
          return invalidInput(definition, state, node.inputKey, "Expected a multi-select input.");
        }

        const allowedValues = new Set(node.options.map((option) => option.value));
        const hasUnknownValue = input.values.some((value) => !allowedValues.has(value));

        if (hasUnknownValue) {
          state.trace.push(traceEntry(node, "blocked"));
          return invalidInput(
            definition,
            state,
            node.inputKey,
            "Selection contains an undeclared option.",
          );
        }

        if (
          input.values.length < node.minimumSelections ||
          input.values.length > node.maximumSelections
        ) {
          state.trace.push(traceEntry(node, "blocked"));
          return invalidInput(
            definition,
            state,
            node.inputKey,
            `Select between ${node.minimumSelections} and ${node.maximumSelections} options.`,
          );
        }

        state.confirmedInputs[node.inputKey] = input;
        const matches = node.branches.filter((branch) =>
          multiSelectBranchMatches(input.values, branch.operator, branch.values),
        );

        if (matches.length > 1) {
          state.trace.push(traceEntry(node, "blocked"));
          return block(
            definition,
            state,
            "ambiguous-branch",
            node.inputKey,
            `Multiple branches matched at node ${node.id}.`,
          );
        }

        const branch = matches[0] ?? node.fallbackBranch;

        if (!branch) {
          state.trace.push(traceEntry(node, "blocked"));
          return block(
            definition,
            state,
            "unmatched-branch",
            node.inputKey,
            `No explicit branch matched at node ${node.id}.`,
          );
        }

        addSelectedBranch(state, node.id, branch.branchId, branch.label);
        state.trace.push(traceEntry(node, "branched", branch.nextNodeId, branch.branchId));
        currentNodeId = branch.nextNodeId;
        break;
      }

      case "boolean-branch": {
        const input = request.inputs[node.inputKey];

        if (input === undefined) {
          state.status = "awaiting-input";
          state.trace.push(traceEntry(node, "awaiting-input"));
          return buildSnapshot(definition, state);
        }

        if (input.kind !== "boolean") {
          state.trace.push(traceEntry(node, "blocked"));
          return invalidInput(
            definition,
            state,
            node.inputKey,
            "Expected a confirmed boolean input.",
          );
        }

        state.confirmedInputs[node.inputKey] = input;
        const branch = input.value ? node.trueBranch : node.falseBranch;
        addSelectedBranch(state, node.id, branch.branchId, branch.label);
        state.trace.push(traceEntry(node, "branched", branch.nextNodeId, branch.branchId));
        currentNodeId = branch.nextNodeId;
        break;
      }

      case "numeric-branch": {
        const numericValue = getNumericValue(state, node.inputKey);

        if (!numericValue) {
          state.trace.push(traceEntry(node, "blocked"));
          return block(
            definition,
            state,
            "missing-required-input",
            node.inputKey,
            `Numeric value ${node.inputKey} was not confirmed or derived.`,
          );
        }

        if (numericValue.unit !== node.unit) {
          state.trace.push(traceEntry(node, "blocked"));
          return block(
            definition,
            state,
            "invalid-input",
            node.inputKey,
            `Numeric branch expected unit ${node.unit}; received ${numericValue.unit}.`,
          );
        }

        const matches = node.branches.filter((branch) =>
          valueIsInRange(numericValue.value, branch.range),
        );

        if (matches.length > 1) {
          state.trace.push(traceEntry(node, "blocked"));
          return block(
            definition,
            state,
            "ambiguous-branch",
            node.inputKey,
            `Multiple numeric branches matched at node ${node.id}.`,
          );
        }

        const branch = matches[0] ?? node.noMatchBranch;

        if (!branch) {
          state.trace.push(traceEntry(node, "blocked"));
          return block(
            definition,
            state,
            "unmatched-branch",
            node.inputKey,
            `No explicit numeric branch matched at node ${node.id}.`,
          );
        }

        addSelectedBranch(state, node.id, branch.branchId, branch.label);
        state.trace.push(traceEntry(node, "branched", branch.nextNodeId, branch.branchId));
        currentNodeId = branch.nextNodeId;
        break;
      }

      case "calculation": {
        const values: number[] = [];

        for (const operand of node.operands) {
          if (operand.kind === "constant") {
            values.push(operand.value);
            continue;
          }

          const numericValue = getNumericValue(state, operand.key);

          if (!numericValue) {
            state.trace.push(traceEntry(node, "blocked"));
            return block(
              definition,
              state,
              "missing-required-input",
              operand.key,
              `Calculation operand ${operand.key} is unavailable.`,
            );
          }

          values.push(numericValue.value);
        }

        const result = calculate(values, node.operation, node.precision, node.roundingMode);

        if (result === null) {
          state.trace.push(traceEntry(node, "blocked"));
          return block(
            definition,
            state,
            "calculation-error",
            node.outputKey,
            `Calculation ${node.id} did not produce a finite result.`,
          );
        }

        state.derivedValues[node.outputKey] = { unit: node.unit, value: result };
        state.trace.push(traceEntry(node, "advanced", node.nextNodeId));
        currentNodeId = node.nextNodeId;
        break;
      }

      case "action-group":
        for (const action of node.actions) {
          (action.timing === "immediate" ? state.immediateActions : state.nextActions).push(action);
        }
        state.trace.push(traceEntry(node, "advanced", node.nextNodeId));
        currentNodeId = node.nextNodeId;
        break;

      case "warning":
        state.warnings.push(...node.warnings);
        state.trace.push(traceEntry(node, "advanced", node.nextNodeId));
        currentNodeId = node.nextNodeId;
        break;

      case "monitoring":
        state.monitoring.push(...node.items);
        state.trace.push(traceEntry(node, "advanced", node.nextNodeId));
        currentNodeId = node.nextNodeId;
        break;

      case "escalation":
        state.escalations.push(...node.items);
        state.trace.push(traceEntry(node, "advanced", node.nextNodeId));
        currentNodeId = node.nextNodeId;
        break;

      case "stop":
        state.status = node.outcome;
        state.stopReason = node.reason;
        state.trace.push(traceEntry(node, "stopped"));
        return buildSnapshot(definition, state);
    }
  }
}

function createInitialState(
  definition: PathwayDefinition,
  nodesById: ReadonlyMap<string, PathwayNode>,
): MutableEvaluationState {
  const entryNode = nodesById.get(definition.entryNodeId);

  return {
    blockReason: null,
    confirmedInputs: {},
    currentNode: entryNode ? toCurrentNode(entryNode) : null,
    derivedClassifications: [],
    derivedValues: {},
    escalations: [],
    immediateActions: [],
    information: [],
    issues: [],
    monitoring: [],
    nextActions: [],
    selectedBranches: [],
    sourceReferences: [],
    status: "awaiting-input",
    stopReason: null,
    trace: [],
    warnings: [],
  };
}

function invalidInput(
  definition: PathwayDefinition,
  state: MutableEvaluationState,
  field: string,
  message: string,
): PathwayEvaluationSnapshot {
  return block(definition, state, "invalid-input", field, message);
}

function block(
  definition: PathwayDefinition,
  state: MutableEvaluationState,
  reason: PathwayBlockReason,
  field: string,
  message: string,
): PathwayEvaluationSnapshot {
  state.status = "blocked";
  state.blockReason = reason;
  state.issues.push({ field, message });
  return buildSnapshot(definition, state);
}

function addSelectedBranch(
  state: MutableEvaluationState,
  nodeId: string,
  branchId: string,
  label: string,
): void {
  const branch = { branchId, label, nodeId };
  state.selectedBranches.push(branch);
  state.derivedClassifications.push(branch);
}

function addSourceReferences(
  state: MutableEvaluationState,
  references: readonly PathwaySourceReference[],
): void {
  const existingKeys = new Set(state.sourceReferences.map(sourceReferenceKey));

  for (const reference of references) {
    const key = sourceReferenceKey(reference);

    if (!existingKeys.has(key)) {
      state.sourceReferences.push(reference);
      existingKeys.add(key);
    }
  }
}

function sourceReferenceKey(reference: PathwaySourceReference): string {
  return `${reference.sourceId}:${reference.page}:${reference.section}`;
}

function toCurrentNode(node: PathwayNode): PathwayCurrentNode {
  return { id: node.id, title: node.title, type: node.type };
}

function traceEntry(
  node: PathwayNode,
  outcome: PathwayTraceEntry["outcome"],
  nextNodeId: string | null = null,
  branchId: string | null = null,
): PathwayTraceEntry {
  return {
    branchId,
    nextNodeId,
    nodeId: node.id,
    nodeType: node.type,
    outcome,
  };
}

function getNumericValue(state: MutableEvaluationState, key: string): PathwayDerivedValue | null {
  const derivedValue = state.derivedValues[key];

  if (derivedValue) {
    return derivedValue;
  }

  const input = state.confirmedInputs[key];
  return input?.kind === "numeric" ? { unit: input.unit, value: input.value } : null;
}

function valueIsInRange(value: number, range: NumericRange): boolean {
  const aboveMinimum =
    range.minimum === null ||
    (range.minimumInclusive ? value >= range.minimum : value > range.minimum);
  const belowMaximum =
    range.maximum === null ||
    (range.maximumInclusive ? value <= range.maximum : value < range.maximum);
  return aboveMinimum && belowMaximum;
}

function hasAllowedPrecision(value: number, precision: number): boolean {
  const factor = 10 ** precision;
  const scaled = value * factor;
  const tolerance = Number.EPSILON * Math.max(1, Math.abs(scaled)) * 4;
  return Math.abs(scaled - Math.round(scaled)) <= tolerance;
}

function multiSelectBranchMatches(
  selectedValues: readonly string[],
  operator: "contains-all" | "contains-any" | "contains-none",
  branchValues: readonly string[],
): boolean {
  const selected = new Set(selectedValues);

  switch (operator) {
    case "contains-all":
      return branchValues.every((value) => selected.has(value));
    case "contains-any":
      return branchValues.some((value) => selected.has(value));
    case "contains-none":
      return branchValues.every((value) => !selected.has(value));
  }
}

function calculate(
  values: readonly number[],
  operation: Extract<PathwayNode, { type: "calculation" }>["operation"],
  precision: number,
  roundingMode: Extract<PathwayNode, { type: "calculation" }>["roundingMode"],
): number | null {
  const [first, ...remaining] = values;

  if (first === undefined) {
    return null;
  }

  let result: number;

  switch (operation) {
    case "add":
      result = remaining.reduce((total, value) => total + value, first);
      break;
    case "subtract":
      result = remaining.reduce((total, value) => total - value, first);
      break;
    case "multiply":
      result = remaining.reduce((total, value) => total * value, first);
      break;
    case "divide":
      if (remaining.some((value) => value === 0)) return null;
      result = remaining.reduce((total, value) => total / value, first);
      break;
    case "maximum":
      result = Math.max(...values);
      break;
    case "minimum":
      result = Math.min(...values);
      break;
  }

  if (!Number.isFinite(result)) {
    return null;
  }

  const factor = 10 ** precision;
  const scaledResult = result * factor;
  let rounded: number;

  switch (roundingMode) {
    case "ceiling":
      rounded = Math.ceil(scaledResult) / factor;
      break;
    case "floor":
      rounded = Math.floor(scaledResult) / factor;
      break;
    case "half-away-from-zero":
      rounded =
        (Math.sign(scaledResult) *
          Math.round(Math.abs(scaledResult) + Number.EPSILON * Math.abs(scaledResult))) /
        factor;
      break;
  }

  return Number.isFinite(rounded) ? rounded : null;
}

function buildSnapshot(
  definition: PathwayDefinition,
  state: MutableEvaluationState,
): PathwayEvaluationSnapshot {
  const explanationSteps = state.trace.map((entry) => {
    const branch = entry.branchId === null ? "" : ` via branch ${entry.branchId}`;
    const destination = entry.nextNodeId === null ? "" : ` to ${entry.nextNodeId}`;
    return `${entry.nodeId}: ${entry.outcome}${branch}${destination}.`;
  });
  const snapshot: PathwayEvaluationSnapshot = {
    blockReason: state.blockReason,
    clinicalReviewStatus: definition.status,
    confirmedInputs: { ...state.confirmedInputs },
    currentNode: state.currentNode,
    derivedClassifications: [...state.derivedClassifications],
    derivedValues: { ...state.derivedValues },
    escalations: [...state.escalations],
    explanation: {
      steps: explanationSteps,
      summary: `Pathway ${definition.pathwayId} ${definition.version} finished with status ${state.status}.`,
      templateVersion: "1.0",
    },
    immediateActions: [...state.immediateActions],
    information: [...state.information],
    issues: [...state.issues],
    monitoring: [...state.monitoring],
    nextActions: [...state.nextActions],
    pathway: {
      id: definition.pathwayId,
      name: definition.name,
      version: definition.version,
    },
    selectedBranches: [...state.selectedBranches],
    sourceReferences: [...state.sourceReferences],
    status: state.status,
    stopReason: state.stopReason,
    trace: [...state.trace],
    warnings: [...state.warnings],
  };

  return deepFreeze(snapshot);
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
