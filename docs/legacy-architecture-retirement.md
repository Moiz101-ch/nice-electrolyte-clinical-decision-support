# Legacy Architecture Retirement

Subtask 3 retired the NICE-only catalogue and synthetic-case architecture on 10 August 2026. The
active application no longer imports, validates, generates or evaluates those files.

## Archived Material

`archive/legacy-nice-prototype/` preserves 50 historical files in their previous relative groups:

- six original project-input artifacts, including the 1,000-row synthetic dataset and workbook;
- two generated runtime catalogue files;
- the generic structured assessment, flat rule engine and clinical-data loaders;
- the deterministic note-extraction experiment;
- the previous assessment and result components;
- legacy build, synchronization and demonstration scripts;
- implementation documentation and tests; and
- the Python requirements used only by the retired spreadsheet workflow.

The archive is excluded from TypeScript, ESLint and Prettier processing. It has no import edge from
the active application, test suite or scripts. Its files remain in Git for historical traceability,
but they must not be copied back into runtime code or treated as clinical authority.

## Active Replacement

The replacement boundary consists of:

```text
clinical-sources/ (immutable originals)
  -> src/clinical/sources/ (validated source registry)
  -> src/clinical/pathways/ (review-gated declarative definitions)
  -> src/clinical/engine/ (deterministic evaluation)
```

No revised pathway definition exists yet. The former `/assessment/new` route therefore displays a
locked migration state with no form controls and no result-generation action.

## Removed Active Dependencies

- npm data-generation, synchronization, extraction and rule-demo commands;
- generated runtime-data validation in CI;
- Python setup, virtual environment and dependency installation in CI;
- active tests that asserted outcomes from the retired catalogue; and
- active imports of `src/clinical-data`, `src/rule-engine`, `src/assessment` and `src/extraction`.

## Verification

The migration is considered technically complete only when:

1. source integrity passes with `npm run sources:check`;
2. no active import or package script references the archived architecture;
3. the locked route has no clinical inputs or result control;
4. formatting, lint, strict types and the full unit suite pass; and
5. browser accessibility, production and Cloudflare builds pass.

Clinical review is not required for the historical move itself because no clinical recommendation
was created or changed. Review remains mandatory before any source-derived pathway is activated.
