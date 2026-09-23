# Hypomagnesaemia Supporting Linkage

Subtask 20 integrates the supplied Hypomagnesaemia document as supporting evidence only. It does
not create or activate a standalone Hypomagnesaemia clinical pathway.

## Registered Source

The source registry records the Tameside and Glossop Integrated Care NHS Foundation Trust document
`Hypomagnesemia Diagnosis & Management` as `supporting-guidance` with `draft` clinical-review
status. The document has identified authors and organisation, but no visible version, issue date,
review date or approval body.

Registry version `1.2.0` links this record bidirectionally with the York and Scarborough Teaching
Hospitals NHS Foundation Trust Hypocalcaemia pathway. The link represents a relevant evidence
relationship, not permission to merge source content.

## Hypocalcaemia Cross-Link

The connected Hypocalcaemia workflow displays a link to
`/review/hypomagnesaemia/supporting-guidance` only after Hypomagnesaemia is explicitly confirmed as
the cause. The supporting page shows source identity, missing metadata, the source mismatch and the
internal content conflict without displaying internal registry IDs or PDF page references.

The Hypocalcaemia pathway continues to generate only its existing source-derived instruction to
identify and treat the underlying cause. Its executable definition does not add the supporting
Hypomagnesaemia source to its `sourceIds` or treatment references.

## Safety Boundary

The supplied supporting document cannot generate treatment because:

- it is not the York guidance cited by the Hypocalcaemia pathway;
- no version, issue date, review date or approval body is visible;
- its narrative and flowchart contain conflicting oral-dose wording;
- clinical approval and public-display reuse permission remain unresolved.

The application therefore does not interpret magnesium values, select oral or intravenous
treatment, calculate a dose, generate monitoring instructions or expose clinical input controls on
the supporting page.

## Validation

```bash
npm run sources:check
npm test -- tests/clinical/source-registry.test.ts
npm test -- tests/clinical/hypomagnesaemia-supporting-link.test.ts
npm test -- tests/design-system/hypomagnesaemia-supporting-guidance-review.test.tsx
```

**STOP: a complete standalone Hypomagnesaemia pathway requires an approved, current and
conflict-resolved source plus explicit clinical authorisation.**
