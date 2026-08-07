# NICE Electrolyte Clinical Decision Support

Educational and technical prototype for adult electrolyte abnormalities using deterministic
NICE-based management rules, structured clinical assessment, optional browser-only extraction
support, and separated evidence-resource retrieval.

This project is not approved for real clinical use. Do not enter real patient-identifiable
information.

## Current Status

Subtask 1 foundation is in progress. The repository now contains the project input package,
Next.js/TypeScript scaffolding, test configuration, repository hygiene files, CI configuration,
and a Python virtual-environment dependency manifest for data-ingestion support scripts.

Feature pages, clinical schemas, rule-engine logic, Cloudflare hosting configuration, and
runtime data copies are intentionally deferred to later approved subtasks.

## Source Inputs

Original supplied files are stored unchanged in `project-input/` for traceability. Runtime-friendly
validated copies will be generated later in `data/`.

## Technology Foundation

- Next.js, React, and TypeScript for the application.
- Tailwind CSS for styling.
- Zod for validation in later schema subtasks.
- Vitest and Testing Library for unit/component tests.
- Playwright and axe-core packages for browser/accessibility testing.
- Python 3.12 virtual environment for support scripts.
- GitHub Actions for automated checks.
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
npm run test
npm run test:coverage
npm run test:e2e
npm run build
```

## Safety Notes

- NICE guidance is the only permitted source for patient-specific management recommendations.
- Additional articles may be shown only as educational resources.
- Unsupported NICE-only scenarios must not generate treatment instructions, doses, or correction
  rates.
- Browser AI, if later approved, must be optional and must not determine rules or management.
- No real patient data should be stored or sent to external services.
