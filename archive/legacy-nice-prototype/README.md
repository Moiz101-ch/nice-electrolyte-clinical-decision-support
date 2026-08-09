# Legacy NICE-Catalogue Prototype

This directory is a non-executable historical archive created during Subtask 3 on 10 August 2026.
It preserves the previous prototype's source package, generated runtime catalogue, generic assessment,
flat rule engine, deterministic extraction experiment, supporting scripts, documentation and tests.

Nothing in this directory is an active clinical or runtime authority. The application, CI, TypeScript,
ESLint and Prettier configurations exclude it. Do not import these files into the current application
or use the synthetic cases to derive clinical logic.

The active source of truth is:

1. immutable supplied documents under `clinical-sources/`;
2. the validated registry under `src/clinical/sources/`; and
3. reviewed declarative pathway definitions under `src/clinical/pathways/` when those definitions are
   implemented and approved.

The original relative structure is retained beneath this directory to support repository history and
future audit work. The archived Python requirements and local-ingestion scripts are preserved only to
explain how the retired spreadsheet/catalogue package was previously processed.
