# NICE Electrolyte Clinical Decision Support

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
- `/assessment/new` is temporarily locked and accepts no clinical input.
- The previous catalogue, synthetic cases, generic assessment, flat rule engine and extraction
  experiment are isolated under `archive/legacy-nice-prototype/`.

See the [source registry](docs/clinical-source-registry.md),
[pathway engine foundation](docs/pathway-engine-foundation.md),
[legacy retirement record](docs/legacy-architecture-retirement.md), and
[repository/source audit](docs/subtask-0-repository-source-audit.md).

## Source Policy

Supplied operational NHS and Trust documents are the primary sources for interactive workflows.
NICE material may be retained as a supporting reference only where it is mapped accurately. Every
future output must expose the pathway version, source document, page, section and clinical-review
status.

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
