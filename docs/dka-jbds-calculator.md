# Current JBDS DKA Technical Calculator

The route `/review/dka/current-calculator` implements a connected deterministic
calculator against the current [JBDS 02 March 2023 listing](https://abcd.care/resource/current/jbds-02-management-diabetic-ketoacidosis-adults).
The 50-page [full guideline](https://abcd.care/sites/default/files/site_uploads/JBDS_Guidelines_Current/JBDS_02_DKA_Guideline_with_QR_code_March_2023.pdf)
is held immutably as `JBDS-02-DKA-MARCH-2023`; the
[updated single-page pathway](https://abcd.care/sites/default/files/resources/JBDS_02_Single_page_pathway_March_2023_updated.pdf)
is an external supporting reference. The historical York 2019 calculator is not used by this
engine. This route is available in production for synthetic technical verification, not patient
care or prescribing.

## Rule Map

| Engine stage              | Governing JBDS material                                                   | Implemented branch                                                                                                                                                               |
| ------------------------- | ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Diagnosis                 | Full guideline section 3, PDF p10                                         | Known diabetes or glucose >11; blood ketones >3 or urine ketones 2+; pH <7.3 or bicarbonate <15. All three groups required.                                                      |
| Risk                      | Full guideline severe-DKA criteria, PDF p23                               | Positive severe flags and special-population fluid cautions; missing observations are never assumed normal.                                                                      |
| Fluids and potassium      | Updated single-page pathway Box 2; full guideline immediate management    | Initial BP <90 versus >=90, post-bolus BP >90, potassium <3.5 / 3.5-5.5 / >5.5, IV-access escalation, later fluid schedule.                                                      |
| Insulin and glucose       | Updated single-page pathway Boxes 1 and 3; full guideline insulin section | FRIII 0.1 units/kg/hour, 10% glucose 125 mL/hour below 14, optional reduced 0.05 units/kg/hour for clinician consideration, usual basal insulin continuation.                    |
| Monitoring                | Updated single-page pathway Boxes 1 and 3                                 | Hourly glucose/ketones, scheduled VBG/potassium, 0.5 mmol/L/hour ketone-fall target or paired 3 mmol/L/hour bicarbonate-rise and glucose-fall fallback when ketones unavailable. |
| Resolution and transition | Full guideline sections D/E and updated single-page Boxes 4-6             | Strict ketones <0.6 **and** pH >7.3; local VRIII if not eating; specialist/local SC plan and at least 30-minute IV overlap after meal-associated short-acting insulin.           |

The full PDF has conflicting older appendix/chart text for resolution (including a <0.3 ketone
threshold and `and/or` wording), while its main text and the updated single-page pathway consistently
define resolution as ketones <0.6 **and** pH >7.3. The engine uses the main text and updated pathway;
the registry records the conflict. The guideline also uses both `<14` and `<=14` in different
locations for insulin-rate consideration. The calculator uses the updated single-page `<14`
threshold and shows the reduced rate only as a value for clinician consideration. Neither these
ambiguities nor unavailable local policies are filled in with invented doses.

The calculator deliberately does not calculate an SC insulin prescription, handle specialist
fluid protocols for pregnancy/cardiac/renal failure, or automatically escalate insulin when
response is poor. It shows the source-directed review or local-policy handoff instead. Values
are held in client memory only; no patient identifier is requested or stored.

## Verification

`tests/clinical/jbds-dka-calculator.test.ts` checks cutoffs, alternatives, low-BP and low-potassium
branches, weight-based arithmetic, response trends and transition boundaries. The source-registry
test verifies the downloaded PDF's SHA-256. The route is interactive in production and retains a
visible technical-use warning.
