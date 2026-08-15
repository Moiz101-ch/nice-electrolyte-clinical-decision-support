# Hyponatraemia Source-Supported Management Endpoints

## Purpose

Version 0.7.0 closes explicit management gaps in the connected Hyponatraemia technical-review
workflow. It uses the supplied one-page Trust pathway as the only treatment source. The supplied
classification images remain diagnostic-classification material and do not independently authorize
treatment.

The implementation remains awaiting clinical review and is not approved for patient care.

## Implemented Endpoints

| Confirmed route                                       | Generated source-supported output                                                                    |
| ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Hypovolaemic, no listed sign                          | Review causes and past medical history; use 1000 mL of 0.9% sodium chloride over 6 to 8 hours        |
| Hypovolaemic emergency reaching cause management      | Add 1000 mL of 0.9% sodium chloride over 6 to 8 hours after the emergency cause-management action    |
| Hypervolaemic                                         | Refer to a senior clinician, obtain a urine dip and treat the underlying cause                       |
| Euvolaemic, water intoxication clinically established | Fluid restriction and consultant review                                                              |
| Euvolaemic, SIADH clinically established              | Use the separate SIADH pathway and obtain consultant review; do not generate SIADH treatment locally |
| Euvolaemic, other/unresolved or unable to establish   | Stop for review without a cause-specific treatment instruction                                       |

## Explicit Clinician Confirmation

The classification engine may report a compatible cause pattern, but it does not diagnose SIADH or
water intoxication. In the non-emergency euvolaemic route, the clinician must explicitly choose one
of these states:

- SIADH already established
- Water intoxication established
- Other or unresolved cause
- Unable to establish safely

Changing fluid status, listed signs, urine-result availability, serum osmolality, urine osmolality or
urine sodium clears this decision.

## Fail-Closed Decisions

- No dedicated SIADH treatment is generated because the referenced separate pathway was not
  supplied.
- No treatment is generated for an unresolved or unsafe euvolaemic cause decision.
- A compatible laboratory pattern never selects treatment automatically.
- The existing undefined four-hour sodium-change interval remains a review stop.
- The existing equality boundaries from the unverified classification images remain review stops.

## Clinical Review Decisions

The clinical reviewer must confirm or correct:

1. Whether the 0.9% sodium-chloride add-on is correctly placed after the hypovolaemic emergency
   cause-management endpoint.
2. Whether the non-emergency hypovolaemic sodium-chloride instruction requires additional
   eligibility checks or warnings.
3. Whether fluid restriction applies to water intoxication exactly as represented.
4. Whether the supplied page intends any local SIADH action in addition to redirection to the
   missing separate pathway.
5. Whether additional criteria are required before the hypervolaemic endpoint can be used.

## Technical Review Cases

### Hypovolaemic non-emergency

- Sodium: `129 mmol/L`
- Fluid status: Hypovolaemic
- Listed signs: None confirmed
- Urine results: available
- Serum osmolality: `270 mOsm/kg`
- Urine sodium: `20 mEq/L`
- Expected: hypovolaemic cause review and 0.9% sodium chloride over 6 to 8 hours

### Euvolaemic water-intoxication endpoint

- Sodium: `129 mmol/L`
- Fluid status: Euvolaemic
- Listed signs: None confirmed
- Urine results: unavailable
- Underlying cause: Water intoxication established
- Expected: fluid restriction and consultant review

### SIADH redirect

- Sodium: `129 mmol/L`
- Fluid status: Euvolaemic
- Listed signs: None confirmed
- Urine results: available
- Serum osmolality: `270 mOsm/kg`
- Urine osmolality: `120 mOsm/kg`
- Urine sodium: `40.1 mEq/L`
- Underlying cause: SIADH already established
- Expected: separate-pathway redirect, consultant review and no SIADH treatment instruction

### Hypervolaemic endpoint

- Sodium: `129 mmol/L`
- Fluid status: Hypervolaemic
- Urine results: unavailable
- Expected: senior referral, urine dip and underlying-cause management

## Review Route

Use `/review/hyponatraemia/assessment`. Internal source references remain attached to pathway nodes,
but document names, IDs and page numbers are intentionally not rendered in the assessment UI.
