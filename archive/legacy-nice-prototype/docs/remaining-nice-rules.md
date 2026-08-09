# Remaining Supported NICE Rules

The catalogue activates seven additional condition-specific NICE pathways:

| Rule                              | Exact selection condition                                                                                                                                                                                              |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NICE-NA-HYPO-IV-001`             | Sodium `<130 mmol/L`, current IV fluids, confirmed temporal relationship, no identified alternative cause, and completed prescription, fluid-status and renal-function review.                                         |
| `NICE-NA-HYPER-IV-001`            | Sodium `>=155 mmol/L`, normal or low baseline sodium, 0.9% sodium chloride in the IV regimen, confirmed temporal relationship, no identified alternative cause, and completed required review.                         |
| `NICE-K-HYPO-IV-001`              | Potassium `<3.0 mmol/L`, current IV fluids without adequate potassium provision, confirmed temporal relationship, no identified alternative cause or other potassium loss, and completed prescription/medicine review. |
| `NICE-CA-PHPT-SCREEN-001`         | Albumin-adjusted calcium `>=2.60 mmol/L`, PHPT explicitly suspected, and symptom, renal-stone and fracture/osteoporosis histories available. The output gives the exact repeat-calcium and PTH sequence.               |
| `NICE-CA-PHPT-REFER-001`          | Confirmed PHPT and confirmed adjusted calcium, plus hypercalcaemia symptoms, end-organ disease, renal stones, fragility fracture/osteoporosis, or adjusted calcium `>=2.85 mmol/L`.                                    |
| `NICE-CA-PHPT-CONSIDER-REFER-001` | Confirmed PHPT without any mandatory criterion in recommendation 1.3.1; returns NICE's separate instruction to consider surgical referral.                                                                             |
| `NICE-NA-ADRENAL-001`             | Confirmed primary adrenal insufficiency with persistent hyponatraemia despite maximum fludrocortisone dose, reviewed sodium trend, and known specialist-involvement status.                                            |

Missing required confirmations return a `blocked` result. Confirmed facts outside these exact
conditions return the source-free `NICE-UNSUPPORTED-001` safety result. No sodium correction,
potassium replacement, or medicine dose is generated.

Run representative outputs with:

```bash
npm run remaining-rules:demo
```

Together with the hyperkalaemia rules, all 15 condition-specific rules in catalogue version `1.1.0`
have deterministic evaluators. The mappings were rechecked against the official NICE pages on
2026-08-09; see `docs/nice-evidence-audit.md`. Catalogue entries retain `Pending` clinical-review
status and are not approved for real clinical use.
