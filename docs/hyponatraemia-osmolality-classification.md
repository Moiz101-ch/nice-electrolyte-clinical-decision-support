# Hyponatraemia Urine and Osmolality Classification

## Status

- Application pathway: `hyponatraemia-osmolality-classification`
- Version: `0.4.0`
- Clinical review: `awaiting-clinical-review`
- Scope: result availability, tonicity, fluid status, urine findings and compatible cause categories
- Activation status: review only; not available for clinical use

## Internal Source Mapping

- `UNVERIFIED-HYPONATRAEMIA-CLASSIFICATION-CAPTURE`
- `UNVERIFIED-HYPONATRAEMIA-CLASSIFICATION-DIAGRAM`
- Mapped content: serum osmolality, ECV status, urine findings, common causes and endocrine exclusions

Both supplied images lack visible organisation, authorship, version, approval and reuse metadata.
They remain unverified and cannot support an approved pathway without clinical provenance review.
Source IDs, file details and mapped locations remain in the internal registry and are intentionally
not displayed in clinician-facing workflow screens.

## Implemented Classification

| State                     | Exact implemented branch                                     | Compatible category                         |
| ------------------------- | ------------------------------------------------------------ | ------------------------------------------- |
| Hypotonic                 | Serum osmolality `<275 mOsm/kg`                              | Continue by fluid status and urine findings |
| Isotonic                  | Serum osmolality `>275` and `<295 mOsm/kg`                   | Pseudohyponatraemia context                 |
| Hypertonic                | Serum osmolality `>295 mOsm/kg`                              | Translocational context                     |
| Hypotonic + hypovolaemic  | Urine sodium `<40 mEq/L`                                     | Non-renal salt loss                         |
| Hypotonic + hypovolaemic  | Urine sodium `>40 mEq/L`                                     | Renal salt loss                             |
| Hypotonic + euvolaemic    | Urine osmolality `<100 mOsm/kg`                              | Primary polydipsia or low-solute state      |
| Hypotonic + euvolaemic    | Urine osmolality `>100 mOsm/kg` and urine sodium `>40 mEq/L` | SIADH-compatible pattern                    |
| Hypotonic + hypervolaemic | Urine findings variable                                      | Volume-overload category                    |

The pathway presents cause categories as compatible patterns, never definitive diagnoses.

## Adaptive Inputs

1. Ask whether urine results are available.
2. If unavailable, stop diagnostic classification without blocking the separate emergency pathway.
3. If available, request serum osmolality.
4. Request fluid status only for hypotonic hyponatraemia.
5. Request urine sodium directly for hypovolaemia.
6. Request urine osmolality first for euvolaemia, then urine sodium only when osmolality is above 100 mOsm/kg.
7. Do not request urine values for isotonic, hypertonic or hypervolaemic endpoints.

Upstream changes clear hidden downstream values before re-evaluation.

## Fail-Closed Edge Cases

| Condition                                                | Safe behaviour                                 |
| -------------------------------------------------------- | ---------------------------------------------- |
| Serum osmolality exactly `275` or `295 mOsm/kg`          | Stop for review; no tonicity or cause category |
| Urine osmolality exactly `100 mOsm/kg`                   | Stop for review; no cause category             |
| Urine sodium exactly `40 mEq/L`                          | Stop for review; no cause category             |
| Euvolaemic, urine osmolality `>100`, urine sodium `<=40` | Stop because no alternative branch is supplied |
| Fluid status cannot be established                       | Stop without selecting a hypotonic cause       |
| Negative, non-finite or over-precision result            | Block as invalid input                         |
| Incorrect unit                                           | Block as invalid input                         |

## SIADH Boundary

The workflow can identify a SIADH-compatible classification pattern only. It does not implement
SIADH management because no approved dedicated SIADH management source was supplied.

## Clinical Review Questions

1. Verify the provenance and current clinical ownership of both classification images.
2. Confirm intended equality handling at `275`, `295`, `100` and `40`.
3. Confirm whether the approximately `275-295 mOsm/kg` isotonic range should include either endpoint.
4. Define the missing euvolaemic branch when urine osmolality is above `100 mOsm/kg` and urine sodium is not above `40 mEq/L`.
5. Confirm the wording and scope of every compatible cause category.
