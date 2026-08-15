# Connected Hyponatraemia Assessment

## Purpose

The connected Hyponatraemia modules run in one technical-review workflow at
`/review/hyponatraemia/assessment`. It replaces manual movement between isolated demonstration
pages for end-to-end software testing, while preserving the existing clinical-review lock.

This is not an active clinical assessment. Version 0.7.0 includes the explicit management endpoints
visible in the supplied Trust pathway while preserving review stops for missing or ambiguous source
content.

## Connected Sequence

1. Confirm the latest sodium result and implemented severity band.
2. Establish fluid status and, where required, explicitly confirm listed signs.
3. Insert emergency follow-up only when a listed sign selects that branch.
4. Complete the adaptive serum/urine classification or record that results are unavailable.
5. For non-emergency euvolaemia, explicitly confirm a source-listed underlying-cause state.
6. Compose the final operational result from the accumulated answers.

The final screen is generated dynamically. It is no longer limited to the fixed representative
result used by `/review/hyponatraemia/result`.

## State And Privacy

Assessment answers live only in React memory. They are not placed in URLs, browser storage,
cookies, a database, analytics, or a server-side session. Refreshing or leaving the page clears the
assessment.

Back navigation preserves valid answers. The explicit Start over command uses a confirmation dialog
before clearing all answers.

## Dependency-Aware Resets

| Changed answer            | Cleared dependent answers                                         |
| ------------------------- | ----------------------------------------------------------------- |
| Sodium                    | Every downstream answer                                           |
| Fluid status              | Signs, emergency follow-up, classification and euvolaemic cause   |
| Listed signs              | Emergency follow-up and euvolaemic underlying-cause decision      |
| ODS risk                  | Symptomatic response and four-hour change                         |
| Symptomatic response      | Four-hour change                                                  |
| Urine-result availability | Serum/urine measurements and euvolaemic underlying-cause decision |
| Serum osmolality          | Urine values and euvolaemic underlying-cause decision             |
| Urine osmolality          | Urine sodium and euvolaemic underlying-cause decision             |
| Urine sodium              | Euvolaemic underlying-cause decision                              |

Independent completed information is retained. For example, changing ODS risk does not remove
laboratory classification values, and changing signs does not remove independent laboratory values.

## Clinical Logic Boundary

The connected UI does not define clinical thresholds. The coordinator calls the existing severity,
fluid-status, emergency, classification, and operational-result engines and uses their statuses and
active node IDs to control progression.

Undefined source boundaries still stop for review. Unavailable urine results allow the final review
to retain completed emergency output without generating a cause category.

## Source-Supported Management Endpoints

- Non-emergency hypovolaemia: cause and history review plus 1000 mL of 0.9% sodium chloride over
  6 to 8 hours.
- Post-emergency hypovolaemia: the same sodium-chloride instruction is added only after the
  source cause-management endpoint.
- Non-emergency hypervolaemia: senior referral, urine dip and underlying-cause management.
- Clinically established water intoxication: fluid restriction and consultant review.
- Clinically established SIADH: redirect to the separate pathway and consultant review; no SIADH
  treatment is generated because that pathway was not supplied.

Compatible laboratory patterns do not automatically confirm an underlying cause.

## Remaining Limitations

- SIADH-compatible classification does not generate SIADH treatment.
- ODS-risk criteria are not defined by the implemented material.
- The exact clinical criteria for water intoxication are not defined by the implemented material.
- The placement of the hypovolaemic sodium-chloride add-on requires clinical confirmation.
- Equality boundaries in the unverified classification images remain fail-closed.
- The workflow remains unapproved and must not be used for patient care.

## Clinical Review Package

The consolidated [Hyponatraemia clinical-review package](clinical-review/hyponatraemia-v0.7.0/README.md)
contains the source map, implementation boundaries, review cases and sign-off checklist for this
connected pathway version.

## Review Checklist

1. Open `/review/hyponatraemia/assessment`.
2. Enter sodium `124 mmol/L` and continue.
3. Select Euvolaemic and Confusion to insert emergency follow-up.
4. Confirm high ODS risk and symptomatic improvement.
5. Record available results: serum osmolality `270`, urine osmolality `120`, urine sodium `40.1`.
6. Confirm the dynamic result shows severe symptomatic management and a SIADH-compatible pattern.
7. Use Back, change the sign answer to None confirmed, and confirm the emergency stage disappears.
8. Confirm Start over requires confirmation and clears the assessment.
9. Confirm no document name, source ID, page number, or citation panel is displayed.
10. Start over, enter sodium `129 mmol/L`, choose Euvolaemic and no listed signs, then record urine
    results as unavailable.
11. Confirm the cause-review stage requires an explicit selection; choose Water intoxication and
    verify that the result shows fluid restriction with consultant review.
