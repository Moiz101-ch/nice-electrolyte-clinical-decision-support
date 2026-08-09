# Declarative Pathway Engine Foundation

Subtask 2 introduces a generic pathway definition and evaluation layer. It deliberately contains no
hyponatraemia, hyperkalaemia, hypocalcaemia or DKA treatment logic. The only complete definition is a
non-clinical fixture under `tests/clinical/fixtures/`.

## Modules

- `src/clinical/pathways/schema.ts` defines the strict Zod schemas and cross-graph validation.
- `src/clinical/pathways/definition.ts` resolves source IDs and page references against the clinical
  source registry and freezes valid definitions.
- `src/clinical/engine/engine.ts` evaluates definitions synchronously from their entry node.
- `src/clinical/engine/types.ts` defines validated input envelopes and the auditable result snapshot.

## Definition Contract

Every definition declares a semantic version, governance status, source IDs, review metadata, entry
node and graph nodes. Supported nodes are:

- information;
- single-choice and multi-select questions;
- numeric input, numeric branch and boolean branch;
- action group, warning, monitoring and escalation;
- typed calculation; and
- explicit completed, unsupported or clinical-review stop states.

Numeric ranges always record both boundary values and whether each boundary is inclusive. Missing
bounds are explicit `null` values. Calculations use a small operation enum and typed operands; pathway
authors must also choose an explicit rounding mode. Pathway data cannot contain executable JavaScript
expressions.

Every node and every action, warning, monitoring item or escalation has at least one source reference
containing a registered source ID, page and section. The loader rejects unknown sources, out-of-range
pages and approval claims that depend on a source below `approved-for-project-use`.

## Safe Evaluation

The engine is a pure replay: each evaluation begins at the entry node and uses only validated,
confirmed input envelopes. It pauses at unanswered input nodes. It blocks rather than guessing when
it encounters invalid units or ranges, missing values, an uncovered branch, multiple matching
branches, a calculation error or a graph cycle.

The immutable snapshot contains pathway identity and status, current node, confirmed inputs, selected
branches, derived classifications and values, actions, warnings, monitoring, escalations, source
references, trace entries and a deterministic explanation. React components are expected to render
this snapshot; they must not implement clinical thresholds.

## Adding A Future Pathway

1. Transcribe only source-supported content into a separate versioned definition.
2. Link every node and output item to the source registry at page and section level.
3. Load the definition with `loadPathwayDefinition` or `createPathwayEngine`.
4. Add exact-boundary, missing-input, unsupported, traceability and deterministic-output tests.
5. Keep the pathway below project approval until its review metadata and all source statuses permit
   approval.

Run `npm test -- tests/clinical/pathway-schema.test.ts tests/clinical/pathway-engine.test.ts` for the
foundation tests and `npm run sources:check` for immutable-source verification.
