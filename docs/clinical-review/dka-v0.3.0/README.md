# DKA Clinical-Review Package v0.3.0

## Review gate

| Field              | Value                                                     |
| ------------------ | --------------------------------------------------------- |
| Package status     | Awaiting clinical review                                  |
| Prepared           | 20 September 2026                                         |
| Local review start | `/review/dka/steps-one-to-four`                           |
| Local continuation | `/review/dka/steps-five-to-ten`                           |
| Technical versions | Foundation `0.1.0`; Steps 1-4 `0.2.0`; Steps 5-10 `0.3.0` |
| Approval record    | None                                                      |

**This is a technical transcription for clinical review, not a clinical decision-support tool.**
The ten-stage source map is complete for review, but the executable pathway deliberately stops
at the unresolved Step 9 rule. Step 10 is an isolated, non-executable source mapping. No DKA
resolution, treatment-stop or insulin-conversion instruction is generated. Public builds display
a locked gate; detailed synthetic previews run only on a local development server. Do not enter
patient information or use this package for patient care.

## Source identity and currentness

The primary source is York Teaching Hospital NHS Foundation Trust, _Guideline for the Management
of Diabetic Ketoacidosis (DKA) in Adults_, version 9, issued May 2019. Its stated review date
was April 2021. The registered source ID is `YTH-DKA-V9-2019`; the immutable file and SHA-256
are pinned in `manifest.json` and the clinical source registry. Registry clinical-review status
is `draft`, reuse is `internal-verification-only`, and the source has an internal-content-conflict
flag. All five activation requirements remain blocked as of package preparation.

The [JBDS 02 adult DKA guideline](https://abcd.care/resource/current/jbds-02-management-diabetic-ketoacidosis-adults)
is a newer UK comparator for the clinical reviewer. It has **not** been silently substituted for
the supplied Trust document, and this package does not claim NICE endorsement or current Trust
approval. The reviewer must decide which current source and local policy govern a future release.

## Complete ten-stage review map

| Stage                          | Source location                      | Implemented technical behavior                                                           | Clinical status                     |
| ------------------------------ | ------------------------------------ | ---------------------------------------------------------------------------------------- | ----------------------------------- |
| 1. Initial assessment          | Page 1, initial assessment           | Adult eligibility; ABCDE, GCS, early warning, IV access, initial bloods and measurements | Synthetic review only               |
| 2. Confirm diagnosis           | Page 1, diagnosis                    | Glucose, ketones and acid-base criteria with missing-value stops                         | Synthetic review only               |
| 3. Initial fluid resuscitation | Page 1, initial fluids               | Initial pressure branch, repeat pressure and senior-review stops                         | Exact repeat 90 mmHg unresolved     |
| 4. Fixed-rate IV insulin       | Page 1, insulin                      | Weight-based rate and source maximum via auditable pathway engine                        | No prescription generated           |
| 5. Further assessment          | Page 2, further assessment           | Examination, precipitant review and source-listed critical-care criteria                 | Escalation requires clinical review |
| 6. Fluid replacement           | Page 2, fluids                       | Timed source sequence with age, pregnancy, cardiac and renal caution stops               | No patient treatment output         |
| 7. Further monitoring          | Page 2, monitoring                   | Glucose, potassium, oxygen, airway and urine-output branches                             | Urgent states halt progression      |
| 8. Assess response             | Page 2, response                     | One-hour ketone, bicarbonate and glucose deltas                                          | No automatic insulin-rate increase  |
| 9. Resolution target           | Page 2, Step 9; page 3, hourly chart | Conflicting source criteria shown as a hard stop                                         | **Blocked**                         |
| 10. Subcutaneous conversion    | Page 4, conversion                   | Regimen-specific wording mapped separately for review                                    | **Not reached or executable**       |

The page 3 hourly monitoring chart is mapped separately as a supplementary source section.
Internal source IDs and page locations are for reviewers and tests; they are not printed in the
workflow interface.

## Calculation inventory

| Calculation or fixed rule      | Source location | Implementation and review evidence                                                                                                  | Safety boundary                                   |
| ------------------------------ | --------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| Initial fixed-rate insulin     | Page 1, Step 4  | `min(weight kg x 0.1 units/kg/hour, 15 units/hour)`; audit preserves weight, operands, uncapped value, maximum and technical result | Prescribing increment and clinical use unapproved |
| Oliguria threshold             | Page 2, Step 7  | `weight kg x 0.5 mL/kg/hour`; urine output below, not equal to, this value selects the source's consideration branch                | No catheter order generated                       |
| Hourly ketone change           | Page 2, Step 8  | Previous minus current ketones over exactly 60 minutes; target `>= 0.5 mmol/L/hour`                                                 | Not a resolution decision                         |
| Hourly bicarbonate change      | Page 2, Step 8  | Current minus previous bicarbonate over exactly 60 minutes; alternative target `>= 3 mmol/L/hour`                                   | Requires glucose trend too                        |
| Hourly glucose change          | Page 2, Step 8  | Previous minus current glucose over exactly 60 minutes; target `>= 3 mmol/L/hour`                                                   | No automatic dose adjustment                      |
| Fluid sequence                 | Page 2, Step 6  | Source's further eight-hour 2-hour, 2-hour and 4-hour bags are mapped as timed text                                                 | Caution contexts stop standard selection          |
| Glucose and potassium branches | Page 2, Step 7  | Fixed source thresholds and bag/rate wording mapped as branches, not calculated prescriptions                                       | Low potassium requires senior review              |
| Resolution and conversion      | Pages 2-4       | Source text and conflicting criteria catalogued                                                                                     | No executable calculation or transition           |

The selected initial synthetic case's weight and resulting technical insulin rate carry into the
later monitoring view. No patient-specific value can be entered in these review routes.

## Boundary evidence

| Boundary or context                                               | Expected deterministic result                                                                                                                        |
| ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Age 17 versus 18 years                                            | Under 18 stops; 18 enters the adult review path                                                                                                      |
| Glucose exactly 11 or ketones exactly 3 mmol/L                    | Does not satisfy strict diagnosis criterion                                                                                                          |
| pH exactly 7.3 and bicarbonate exactly 15 mmol/L                  | Neither acid-base alternative confirms the criterion                                                                                                 |
| Initial pressure above 90 mmHg                                    | Direct source branch; repeat of exactly 90 mmHg after a low initial pressure stops for clarification                                                 |
| Weight 150 versus 160 kg                                          | Technical rate is 15 units/hour at both; source maximum is applied only above 150 kg                                                                 |
| Step 5 threshold equality                                         | Ketones 6, bicarbonate 5, pH 7.1, potassium 3.5, GCS 12, oxygen 92%, pressure 90, pulse 60 or 100 do not trigger their strict escalation comparisons |
| Age 25 versus 26 years                                            | Standard fluids withheld for the source's young-adult caution at 25; not for age alone at 26                                                         |
| Potassium 3.4, 3.5, 5.5 and 5.6 mmol/L                            | Urgent review below 3.5; middle branch inclusive; no-added-potassium branch above 5.5                                                                |
| Glucose 13.9 versus 14 mmol/L                                     | Source glucose addition branch only below 14                                                                                                         |
| Urine output 35.9 versus 36 mL/hour at 72 kg                      | Below-threshold branch only at 35.9                                                                                                                  |
| Hourly changes exactly 0.5 ketones or 3 bicarbonate and 3 glucose | Source response target met only with the acid-base alternative **and** glucose condition                                                             |
| Hourly response below target or interval other than 60 minutes    | Stops for review; no adjusted insulin dose                                                                                                           |
| Apparent resolution under either conflicting source wording       | Always blocked; Step 10 remains not reached                                                                                                          |
| Missing, malformed or uncertain required values                   | No inferred lower-risk branch or treatment output                                                                                                    |

These examples are pinned in the automated clinical tests. Test cases are synthetic and do not
constitute validation against real patients.

## Ambiguity and limitation register

| ID            | Unresolved item                                                                           | Current safety behavior                                        |
| ------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| `DKA-AMB-001` | April 2021 source review date has passed                                                  | All activation gates remain closed                             |
| `DKA-AMB-002` | Source-derived public-display reuse is not cleared                                        | Detailed review is development-only; public routes stay locked |
| `DKA-AMB-003` | Step 9 and page 3 chart disagree on AND/OR resolution logic and bicarbonate equality      | No resolution or conversion result                             |
| `DKA-AMB-004` | Step 8 rate-increase wording may conflict with the Step 4 maximum                         | No adjusted infusion rate is calculated                        |
| `DKA-AMB-005` | Repeat systolic pressure of exactly 90 mmHg is not assigned a follow-on branch            | Stop for senior/source review                                  |
| `DKA-AMB-006` | The source does not state a prescribing increment for the computed insulin rate           | Audit shows a technical value only                             |
| `DKA-AMB-007` | Young-adult, pregnancy, older-age, cardiac and renal fluid contexts need individual plans | Standard fluid sequence is withheld                            |
| `DKA-AMB-008` | Step 10 cannot be entered while Step 9 is unresolved                                      | Regimen mapping is isolated and labelled non-executable        |
| `DKA-AMB-009` | Current Trust governance approval and named project reviewers are absent                  | Manifest approval remains `null`                               |
| `DKA-AMB-010` | Synthetic cases cannot establish clinical performance, usability or safety                | Clinical validation and governance remain required             |

## Evidence and screenshots

The manifest lists the source registry, automated boundary tests, component and end-to-end tests,
the pending checklist and four representative screenshots. Screenshots are captured from fixed
synthetic cases using `node scripts/capture-dka-review-screenshots.mjs` while a local development
server is running. They show the capped initial rate, connected monitoring, the hard resolution
stop and a mobile inadequate-response review. They are technical-review evidence only.

The screenshots and public-build test do not establish clinical accuracy or approval. Reviewers
must inspect the source PDF, compare current guidance, verify every transcription and formula,
resolve the ambiguity register, assess the interface and document a governance decision.

## Reviewer sign-off

Complete `review-checklist.csv` with reviewer names, roles, dates, decisions and required
changes. Leave `approval` as `null` unless an authorised decision is recorded against the exact
source file hash. Any approved revision requires fresh tests, screenshots and a new package
version. The current source and internal conflict do not permit activation.

**STOP HERE FOR CLINICAL REVIEW.**
