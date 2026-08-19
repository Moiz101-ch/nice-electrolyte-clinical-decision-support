# Electrolyte Pathways

Source-governed prototype for deterministic adult electrolyte pathways. The project is migrating
from a retired synthetic-data/NICE catalogue to pathway-specific implementations transcribed from
supplied NHS and Trust documents.

No clinical pathway is currently active. The application must not be used for diagnosis, treatment
or management decisions, and no patient-identifiable information should be entered.

## Current Architecture

- Original clinical attachments are preserved unchanged under `clinical-sources/`.
- `src/clinical/sources/` provides the typed, SHA-256-verified source registry.
- `src/clinical/pathways/` provides strict declarative pathway schemas and governance validation.
- `src/clinical/engine/` provides deterministic, fail-closed pathway evaluation.
- `components/clinical/` provides reusable, accessible pathway input and result presentation.
- `/assessment/new` is temporarily locked and accepts no clinical input.
- `/review/pathway-ui` presents the shared UI framework with non-evaluated demonstration states.
- `/review/hyponatraemia/severity` previews source-derived sodium severity classification only.
- `/review/hyponatraemia/fluid-status` previews adaptive volume-state and source-listed sign
  branches without management output.
- `/review/hyponatraemia/emergency-management` previews the source-derived symptomatic emergency
  branch, correction safeguards and monitoring behind an explicit clinical-review warning.
- `/review/hyponatraemia/classification` previews adaptive serum/urine osmolality classification,
  compatible cause categories and a guarded SIADH-compatible endpoint.
- `/review/hyponatraemia/result` consolidates one representative evaluated branch into an
  operational review of actions, monitoring, safety, compatible causes, rationale and governance.
- `/review/hyponatraemia/assessment` connects the implemented Hyponatraemia stages in one
  in-memory technical-review workflow with dependency-aware answer resets, explicit
  euvolaemic-cause confirmation and source-supported management endpoints.
- `/review/hyperkalaemia/severity` previews source-derived potassium severity and initial checks,
  including conditional ECG monitoring and the 7.0 mmol/L safeguard.
- `/review/hyperkalaemia/assessment` connects potassium severity, source-listed ECG changes,
  calcium context, pre-treatment glucose, salbutamol context, timed actions, monitoring and
  recurrence prevention while holding unresolved source conflicts for review.
- The previous catalogue, synthetic cases, generic assessment, flat rule engine and extraction
  experiment are isolated under `archive/legacy-nice-prototype/`.

See the [source registry](docs/clinical-source-registry.md),
[pathway engine foundation](docs/pathway-engine-foundation.md),
[hyponatraemia fluid-status workflow](docs/hyponatraemia-fluid-status.md),
[hyponatraemia emergency management](docs/hyponatraemia-emergency-management.md),
[hyponatraemia urine/osmolality classification](docs/hyponatraemia-osmolality-classification.md),
[hyponatraemia operational result](docs/hyponatraemia-operational-result.md),
[connected hyponatraemia assessment](docs/hyponatraemia-connected-assessment.md),
[hyponatraemia source-supported management](docs/hyponatraemia-source-supported-management.md),
[Hyponatraemia clinical-review package](docs/clinical-review/hyponatraemia-v0.7.0/README.md),
[Hyperkalaemia severity workflow](docs/hyperkalaemia-severity.md),
[Hyperkalaemia ECG workflow](docs/hyperkalaemia-ecg-workflow.md),
[Hyperkalaemia timed management](docs/hyperkalaemia-timed-management.md),
[Hyperkalaemia clinical-review package](docs/clinical-review/hyperkalaemia-v0.3.0/README.md),
[legacy retirement record](docs/legacy-architecture-retirement.md), and
[repository/source audit](docs/subtask-0-repository-source-audit.md).

## Source Policy

Supplied operational NHS and Trust documents are the primary sources for interactive workflows.
NICE material may be retained as a supporting reference only where it is mapped accurately. Source
documents, page/section mappings and registry IDs remain available internally for governance and
testing, but are not displayed in clinician-facing workflow screens. Pathway version and
clinical-review status remain visible.

Synthetic cases may be introduced only as source-derived tests around reviewed boundaries. They
must never define, train or infer clinical rules.

## Technology

- Next.js 16, React 19 and strict TypeScript
- Zod runtime validation
- Tailwind CSS, Radix UI and Lucide icons
- Vitest, Testing Library, Playwright and axe-core
- OpenNext, Wrangler and Cloudflare Workers deployment support

Python is not required by the active project.

## Local Setup

```bash
npm install
npm run dev
```

## Commands

```bash
npm run format
npm run format:check
npm run lint
npm run typecheck
npm run sources:check
npm run test
npm run test:coverage
npm run test:e2e
npm run build
npm run cf:build
npm run preview
```

Cloudflare deployment, environment-variable and rollback instructions are in
[`docs/cloudflare-deployment.md`](docs/cloudflare-deployment.md).

## Safety

- No pathway may become active merely because its software implementation is complete.
- Clinical review and project approval are explicit, separate governance states.
- Missing, ambiguous or unsupported branches must fail closed without treatment instructions.
- Clinical decision logic must not be placed in React components or inferred by AI.
- Archived catalogue files and synthetic cases are historical evidence, not runtime inputs.
