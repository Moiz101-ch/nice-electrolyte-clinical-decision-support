# Deterministic Extraction

`extractClinicalNote` converts explicit text into a typed, in-memory review draft. It recognises
electrolyte measurements, `mmol/L` units, age, stated abnormality, known clinical contexts, CKD
stage, eGFR, IV-fluid status, 0.9% sodium chloride, dialysis, and a controlled medicine dictionary.

Every field has one of four states:

- `confirmed`: one explicit, supported value was found.
- `missing`: no explicit value was found.
- `uncertain`: text was found but could not be safely normalised, such as an unsupported unit.
- `conflicting`: incompatible explicit values were found; no value is selected.

The parser does not infer a diagnosis from a number, infer absent context, determine urgency, select
a rule, or generate management advice. Its evidence snippets are for user review only and are never
stored by this module. The synthetic set's held-out test split is not used for parser development or
the representative demonstration.

Run the synthetic examples with:

```bash
npm run extraction:demo
```

The command prints selected training-split examples and their parsed fields. The displayed dataset
rule ID is traceability metadata, not a rule-engine result.
