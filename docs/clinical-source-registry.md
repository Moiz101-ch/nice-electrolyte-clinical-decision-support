# Clinical Source Registry

The clinical source registry is the validated inventory of documents that may support future
interactive pathways. It does not contain pathway branching, treatment logic or executable rules.

## Files

- `src/clinical/sources/clinical-source-registry.json`: declarative source records.
- `src/clinical/sources/schema.ts`: Zod metadata and governance validation.
- `src/clinical/sources/registry.ts`: immutable loading, lookup and currentness API.
- `src/clinical/sources/integrity.ts`: path, file-size, hash and unregistered-file checks.
- `scripts/check-clinical-source-registry.ts`: command-line integrity gate.

## Commands

```bash
npm run sources:check
npm test -- tests/clinical/source-registry.test.ts
```

## Governance

Registry status is separate from software completion. A source may move only through the supported
review states and cannot be marked `approved-for-project-use` while approval-blocking flags remain.
Unknown dates use `null`; month-only dates retain month precision instead of inventing a day.

The registry currently contains seven immutable files:

| Scope           | Records | Status                                                        |
| --------------- | ------: | ------------------------------------------------------------- |
| Hyponatraemia   |       3 | One pathway awaiting review; two unverified diagrams in draft |
| Hyperkalaemia   |       1 | Awaiting review; review due November 2026                     |
| Hypocalcaemia   |       1 | Awaiting review                                               |
| Hypomagnesaemia |       1 | Draft with incomplete metadata and an internal conflict       |
| DKA             |       1 | Draft; review overdue since April 2021                        |

No source is clinically approved for project use. The original files remain under
`clinical-sources/` and must not be edited in place.
