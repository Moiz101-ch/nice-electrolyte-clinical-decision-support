# NICE Electrolyte Clinical Decision Support

Educational and technical prototype for adult electrolyte abnormalities using deterministic
NICE-based management rules, structured clinical assessment, optional browser-only extraction
support, and separated evidence-resource retrieval.

This project is not approved for real clinical use. Do not enter real patient-identifiable
information.

## Current Status

The repository contains the project input package, Next.js/TypeScript scaffolding, test
configuration, repository hygiene files, CI configuration, a Python virtual-environment
dependency manifest for data-ingestion support scripts, and a Cloudflare Workers deployment
foundation using OpenNext. A responsive application shell, Home page, and accessible clinical
design system provide the shared interface foundation for upcoming feature work.

The new-assessment route now provides a schema-validated, adaptive structured workflow. It preserves
data while moving backward, shows inline errors, supports editable confirmation, and passes confirmed
browser-only data to the deterministic rule engine. Its complete result view shows priority,
confirmed inputs, locked NICE output, deterministic rationale, missing information, limitations, and
exact NICE source traceability. Supported, unsupported, and safely blocked outcomes have distinct
safety presentations. See [`docs/structured-assessment.md`](docs/structured-assessment.md) and
[`docs/results-interface.md`](docs/results-interface.md).

Deterministic note extraction now creates an in-memory, reviewable draft from explicit text. It does
not infer missing fields, select NICE rules, or generate clinical guidance. Details and supported
fields are documented in [`docs/deterministic-extraction.md`](docs/deterministic-extraction.md).

The deterministic rule engine validates confirmed inputs, evaluates registered rules by clinical
context and explicit order, builds catalogue-traceable results, and fails safely. All 13
condition-specific catalogue pathways now have deterministic evaluators, covering IV-fluid
abnormalities, CKD/RAAS monitoring and prescribing, hyperkalaemia medicine eligibility, AKI
escalation, PHPT and primary adrenal insufficiency. Unsupported scenarios still return no treatment
instructions. See [`docs/rule-engine-foundation.md`](docs/rule-engine-foundation.md),
[`docs/hyperkalaemia-rules.md`](docs/hyperkalaemia-rules.md), and
[`docs/remaining-nice-rules.md`](docs/remaining-nice-rules.md). The current official-source mapping
and exact boundaries are recorded in [`docs/nice-evidence-audit.md`](docs/nice-evidence-audit.md).

## Source Inputs

Original supplied files are stored unchanged in `project-input/` for traceability. Validated,
runtime-friendly copies are generated in `data/runtime/`; see
[`docs/runtime-data.md`](docs/runtime-data.md) for the update workflow and validation rules.

## Technology Foundation

- Next.js, React, and TypeScript for the application.
- Tailwind CSS for styling.
- Self-hosted Inter Variable typography and semantic clinical design tokens.
- Radix primitives and Lucide icons for accessible interactions and navigation.
- Zod for validation in later schema subtasks.
- Vitest and Testing Library for unit/component tests.
- Playwright and axe-core packages for browser/accessibility testing.
- Python 3.12 virtual environment for support scripts.
- GitHub Actions for automated checks.
- OpenNext and Wrangler for credential-free local Cloudflare Worker previews and later deployment.
- Next.js telemetry is disabled in repository scripts and CI.

## Local Setup

Install JavaScript dependencies:

```bash
npm install
```

Create and populate the Python virtual environment:

```bash
python -m venv .venv
.venv\Scripts\python -m pip install -r requirements.txt
```

Run the local development server:

```bash
npm run dev
```

## Commands

```bash
npm run format
npm run format:check
npm run lint
npm run typecheck
npm run data:build
npm run data:check
npm run extraction:demo
npm run hyperkalaemia:demo
npm run remaining-rules:demo
npm run rule-engine:demo
npm run test
npm run test:coverage
npm run test:e2e
npm run build
npm run cf:build
npm run preview
```

Cloudflare deployment, environment-variable, free-tier, and rollback instructions are in
[`docs/cloudflare-deployment.md`](docs/cloudflare-deployment.md).

## Safety Notes

- NICE guidance is the only permitted source for patient-specific management recommendations.
- Additional articles may be shown only as educational resources.
- Unsupported NICE-only scenarios must not generate treatment instructions, doses, or correction
  rates.
- Browser AI, if later approved, must be optional and must not determine rules or management.
- No real patient data should be stored or sent to external services.
