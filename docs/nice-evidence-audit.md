# NICE Evidence Audit

Catalogue version: `1.1.0`  
Evidence rechecked: `2026-08-09`  
Management source policy: official NICE guidance only

This audit maps executable management outputs to the current official NICE pages. It records
technical source verification, not clinical approval. Every rule remains `Pending` until a
qualified clinical reviewer signs it off.

## Verified Sources

| Source                                                                                                                   | Recommendations used                                               | Deterministic use                                                                                                    |
| ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| [CG174: Intravenous fluid therapy in adults in hospital](https://www.nice.org.uk/guidance/cg174/chapter/Recommendations) | 1.1.1, 1.1.6, 1.2.4, 1.2.6, 1.4.1, 1.4.4, 1.5.1, 1.5.2 and Table 1 | Adult IV-fluid assessment, exact incident thresholds, prescription reassessment, expert help and incident reporting. |
| [NG203: Chronic kidney disease](https://www.nice.org.uk/guidance/ng203/chapter/Recommendations)                          | 1.6.15 to 1.6.19                                                   | Potassium/eGFR monitoring and exact RAAS-antagonist pretreatment and stopping decisions.                             |
| [TA1148: Sodium zirconium cyclosilicate](https://www.nice.org.uk/guidance/ta1148/chapter/1-Recommendations)              | 1.1                                                                | Acute life-threatening and persistent hyperkalaemia eligibility. TA1148 replaced TA599 in April 2026.                |
| [TA623: Patiromer](https://www.nice.org.uk/guidance/ta623/chapter/1-Recommendations)                                     | 1.1                                                                | Acute life-threatening and persistent hyperkalaemia eligibility.                                                     |
| [NG148: Acute kidney injury](https://www.nice.org.uk/guidance/ng148/chapter/Recommendations)                             | 1.5.8 to 1.5.11                                                    | Immediate renal-replacement-therapy referral when hyperkalaemia is not responding to medical management.             |
| [NG132: Primary hyperparathyroidism](https://www.nice.org.uk/guidance/ng132/chapter/Recommendations)                     | 1.1.1, 1.1.3 to 1.1.6, 1.3.1 and 1.3.2                             | Albumin-adjusted calcium/PTH diagnostic sequence and mandatory versus considered surgical referral.                  |
| [NG243: Adrenal insufficiency](https://www.nice.org.uk/guidance/ng243/chapter/recommendations)                           | 1.3.5                                                              | Specialist-advised sodium chloride supplementation in the exact persistent-hyponatraemia context.                    |

## Exact Boundaries

| Rule group                    | Boundary or required context                                                                                                                 |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| CG174 IV-fluid hyponatraemia  | Sodium `<130 mmol/L`, no likely alternative cause, during IV therapy or within 24 hours after stopping.                                      |
| CG174 IV-fluid hypernatraemia | Sodium `>=155 mmol/L`, baseline normal/low, regimen included 0.9% sodium chloride, no likely alternative cause, within the same time window. |
| CG174 IV-fluid hyperkalaemia  | Potassium `>5.5 mmol/L`, no obvious alternative cause, within the same time window.                                                          |
| CG174 IV-fluid hypokalaemia   | Potassium `<3.0 mmol/L`, inadequate potassium provision is likely, no obvious alternative cause, within the same time window.                |
| NG203 RAAS pretreatment       | Do not routinely offer when pretreatment potassium is `>5.0 mmol/L`.                                                                         |
| NG203 RAAS stopping           | Stop at `>=6.0 mmol/L` only after other medicines that promote hyperkalaemia have been discontinued.                                         |
| TA1148 persistent eligibility | Confirmed potassium `>=5.5 mmol/L`, CKD 3b-5 or heart failure, RAAS dosage not optimised because of hyperkalaemia, no dialysis.              |
| TA623 persistent eligibility  | Confirmed potassium `>=6.0 mmol/L`, CKD 3b-5 or heart failure, RAAS absent/reduced because of hyperkalaemia, no dialysis.                    |
| NG132 PHPT hypercalcaemia     | Albumin-adjusted calcium `>=2.60 mmol/L`; mandatory surgical referral at `>=2.85 mmol/L` or with the listed symptoms/end-organ disease.      |

## Corrections In Version 1.1.0

- Calcium `2.60 mmol/L` now enters the NG132 PHPT pathway instead of being rejected.
- Confirmed PHPT without a mandatory recommendation 1.3.1 criterion now returns the separate
  recommendation 1.3.2 result to consider surgical referral.
- TA1148 persistent eligibility now accepts every RAAS state that means an optimised dosage is not
  being taken because of hyperkalaemia, including reduced and absent therapy.
- At potassium `>=6.0 mmol/L` with absent/reduced RAAS therapy, the result shows both eligible NICE
  binder options and both sources instead of hiding the TA1148 option.
- Acute life-threatening hyperkalaemia now has an explicit emergency-care eligibility pathway.
  Binder options are shown only when standard emergency care is confirmed as underway.
- CG174 outputs now distinguish detection and IV-plan reassessment from a complete electrolyte
  treatment regimen, and include the guideline's incident-reporting requirement.
- Contradictory condition/value pairs are blocked in the rule-engine schema as well as in the form.
- The management CSV must exactly match the authoritative JSON catalogue or automated tests fail.

## Safety Position

- General adult sodium, potassium, calcium or magnesium treatment is unsupported unless an exact
  catalogue context matches.
- No sodium-correction regimen, potassium-replacement dose or emergency standard-care regimen is
  inferred from a source that does not provide it.
- Article search and AI extraction cannot change deterministic management output.
- Source verification does not replace clinical governance. Real clinical use requires qualified
  clinical review, local policy review, medical-device assessment and release approval.
