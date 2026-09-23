# Clinical Source Registry

The clinical source registry is the validated inventory of documents that may support future
interactive pathways. It does not contain pathway branching, treatment logic or executable rules.
Registry version `1.3.0` was audited on 20 September 2026.

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

The registry currently contains nine immutable files:

| Scope           | Records | Status                                                             |
| --------------- | ------: | ------------------------------------------------------------------ |
| Hyponatraemia   |       3 | One pathway awaiting review; two unverified diagrams in draft      |
| Hyperkalaemia   |       2 | Trust pathway plus UKKA supporting guidance; both awaiting review  |
| Hypocalcaemia   |       1 | Awaiting review                                                    |
| Hypomagnesaemia |       1 | Draft with incomplete metadata and an internal conflict            |
| DKA             |       2 | Historical York source overdue; current JBDS 02 source is separate |

No source is clinically approved for project use. The original files remain under
`clinical-sources/` and must not be edited in place.

## Supporting Relationships

`getRelatedSources(sourceId)` returns validated, immutable relationships between registered
records. A relationship does not merge clinical scopes or grant treatment authority.

The draft Tameside Hypomagnesaemia guidance is linked bidirectionally with the York Hypocalcaemia
pathway because Hypomagnesaemia may be recorded as a cause in that workflow. The sources remain
separate: the supplied magnesium document is not the York document cited by the Hypocalcaemia
pathway and its conflicting dose wording is not executable.

The historical York DKA source remains a draft record with an overdue April 2021 review date and
an internal resolution conflict. The separately registered current JBDS 02 source drives a
local-only synthetic calculator; it does not activate a public clinical pathway.
