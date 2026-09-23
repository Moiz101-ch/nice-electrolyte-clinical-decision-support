import type { PathwaySourceRecord } from "../../../src/clinical/pathways/definition.ts";
import type { PathwayDefinition } from "../../../src/clinical/pathways/schema.ts";

export const foundationSources: readonly PathwaySourceRecord[] = [
  {
    clinicalReviewStatus: "draft",
    pageCount: 2,
    sourceId: "TEST-SOURCE-001",
  },
];

const sourceReference = () => ({
  page: 1,
  section: "Non-clinical engine test fixture",
  sourceId: "TEST-SOURCE-001",
});

export function buildFoundationPathway(): PathwayDefinition {
  return {
    entryNodeId: "start",
    name: "Non-clinical pathway engine fixture",
    nodes: [
      {
        body: "This fixture verifies traversal without representing clinical guidance.",
        id: "start",
        nextNodeId: "score-input",
        sourceReferences: [sourceReference()],
        title: "Start",
        type: "information",
      },
      {
        acceptedRange: {
          maximum: 10,
          maximumInclusive: true,
          minimum: 0,
          minimumInclusive: true,
        },
        id: "score-input",
        inputKey: "score",
        nextNodeId: "score-branch",
        precision: 1,
        prompt: "Enter the non-clinical test score.",
        sourceReferences: [sourceReference()],
        title: "Test score",
        type: "numeric-input",
        unit: "points",
      },
      {
        branches: [
          {
            branchId: "lower-score",
            label: "Lower test branch",
            nextNodeId: "lower-actions",
            range: {
              maximum: 5,
              maximumInclusive: false,
              minimum: 0,
              minimumInclusive: true,
            },
          },
          {
            branchId: "higher-score",
            label: "Higher test branch",
            nextNodeId: "test-warning",
            range: {
              maximum: 10,
              maximumInclusive: true,
              minimum: 5,
              minimumInclusive: true,
            },
          },
        ],
        id: "score-branch",
        inputKey: "score",
        noMatchBranch: null,
        sourceReferences: [sourceReference()],
        title: "Classify test score",
        type: "numeric-branch",
        unit: "points",
      },
      {
        actions: [
          {
            actionId: "record-result",
            instruction: "Record the fixture result.",
            sourceReferences: [sourceReference()],
            timing: "immediate",
          },
          {
            actionId: "review-result",
            instruction: "Review the fixture result later.",
            sourceReferences: [sourceReference()],
            timing: "next",
          },
        ],
        id: "lower-actions",
        nextNodeId: "completed-stop",
        sourceReferences: [sourceReference()],
        title: "Fixture actions",
        type: "action-group",
      },
      {
        id: "test-warning",
        nextNodeId: "confirmation-question",
        sourceReferences: [sourceReference()],
        title: "Fixture warning",
        type: "warning",
        warnings: [
          {
            message: "This is a non-clinical warning used only by automated tests.",
            severity: "caution",
            sourceReferences: [sourceReference()],
            warningId: "fixture-warning",
          },
        ],
      },
      {
        id: "confirmation-question",
        inputKey: "confirmation",
        options: [
          {
            label: "Continue",
            nextNodeId: "feature-selection",
            optionId: "continue-option",
            value: "continue",
          },
          {
            label: "Stop",
            nextNodeId: "unsupported-stop",
            optionId: "stop-option",
            value: "stop",
          },
        ],
        prompt: "Continue through the engine fixture?",
        sourceReferences: [sourceReference()],
        title: "Fixture confirmation",
        type: "single-choice-question",
      },
      {
        branches: [
          {
            branchId: "feature-a-selected",
            label: "Feature A selected",
            nextNodeId: "boolean-decision",
            operator: "contains-any",
            values: ["feature-a"],
          },
        ],
        fallbackBranch: {
          branchId: "feature-fallback",
          label: "No supported feature selected",
          nextNodeId: "unsupported-stop",
        },
        id: "feature-selection",
        inputKey: "features",
        maximumSelections: 2,
        minimumSelections: 0,
        options: [
          { label: "Feature A", optionId: "feature-a-option", value: "feature-a" },
          { label: "Feature B", optionId: "feature-b-option", value: "feature-b" },
        ],
        prompt: "Select fixture features.",
        sourceReferences: [sourceReference()],
        title: "Fixture features",
        type: "multi-select-question",
      },
      {
        falseBranch: {
          branchId: "not-confirmed",
          label: "Not confirmed",
          nextNodeId: "review-stop",
        },
        id: "boolean-decision",
        inputKey: "proceed",
        prompt: "Confirm fixture progression.",
        sourceReferences: [sourceReference()],
        title: "Fixture decision",
        trueBranch: {
          branchId: "confirmed",
          label: "Confirmed",
          nextNodeId: "score-calculation",
        },
        type: "boolean-branch",
      },
      {
        formula: "score + 2",
        id: "score-calculation",
        nextNodeId: "adjusted-score-branch",
        operands: [
          { key: "score", kind: "numeric-input" },
          { kind: "constant", value: 2 },
        ],
        operation: "add",
        outputKey: "adjustedScore",
        precision: 1,
        roundingMode: "half-away-from-zero",
        sourceReferences: [sourceReference()],
        sourceDefinedLimit: null,
        title: "Fixture calculation",
        type: "calculation",
        unit: "points",
      },
      {
        branches: [
          {
            branchId: "lower-adjusted-score",
            label: "Lower adjusted score",
            nextNodeId: "fixture-monitoring",
            range: {
              maximum: 7,
              maximumInclusive: false,
              minimum: null,
              minimumInclusive: false,
            },
          },
          {
            branchId: "higher-adjusted-score",
            label: "Higher adjusted score",
            nextNodeId: "fixture-escalation",
            range: {
              maximum: 12,
              maximumInclusive: true,
              minimum: 7,
              minimumInclusive: true,
            },
          },
        ],
        id: "adjusted-score-branch",
        inputKey: "adjustedScore",
        noMatchBranch: null,
        sourceReferences: [sourceReference()],
        title: "Classify adjusted fixture score",
        type: "numeric-branch",
        unit: "points",
      },
      {
        id: "fixture-monitoring",
        items: [
          {
            instruction: "Observe the fixture state.",
            monitoringId: "observe-fixture",
            sourceReferences: [sourceReference()],
          },
        ],
        nextNodeId: "fixture-escalation",
        sourceReferences: [sourceReference()],
        title: "Fixture monitoring",
        type: "monitoring",
      },
      {
        id: "fixture-escalation",
        items: [
          {
            escalationId: "fixture-review",
            instruction: "Escalate this fixture to its automated assertion.",
            sourceReferences: [sourceReference()],
            urgency: "routine",
          },
        ],
        nextNodeId: "completed-stop",
        sourceReferences: [sourceReference()],
        title: "Fixture escalation",
        type: "escalation",
      },
      {
        id: "completed-stop",
        outcome: "completed",
        reason: "The non-clinical fixture completed.",
        sourceReferences: [sourceReference()],
        title: "Fixture complete",
        type: "stop",
      },
      {
        id: "unsupported-stop",
        outcome: "unsupported",
        reason: "The selected fixture path is unsupported.",
        sourceReferences: [sourceReference()],
        title: "Unsupported fixture path",
        type: "stop",
      },
      {
        id: "review-stop",
        outcome: "requires-clinical-review",
        reason: "The fixture demonstrates a review-gated stop state.",
        sourceReferences: [sourceReference()],
        title: "Fixture review required",
        type: "stop",
      },
    ],
    pathwayId: "foundation-engine-fixture",
    reviewMetadata: {
      approvedBy: null,
      approvedOn: null,
      notes: ["Automated non-clinical fixture only."],
      reviewedBy: null,
      reviewedOn: null,
      status: "draft",
    },
    sourceIds: ["TEST-SOURCE-001"],
    status: "draft",
    version: "1.0.0",
  };
}
