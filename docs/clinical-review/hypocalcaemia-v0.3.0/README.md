# Hypocalcaemia Clinical-Review Package v0.3.0

## Review gate

| Field                   | Value                              |
| ----------------------- | ---------------------------------- |
| Package status          | Awaiting clinical review           |
| Prepared                | 17 September 2026                  |
| Review route            | `/review/hypocalcaemia/assessment` |
| Runtime pathway version | `0.3.0`                            |
| Approval record         | Not approved                       |

This package is a technical transcription for review. It is not an approved clinical pathway and
must not be used for patient care until an authorised clinical reviewer completes the checklist,
resolves the ambiguity register and records governance approval.

## Clinical source

The implemented pathway is derived from York and Scarborough Teaching Hospitals NHS Foundation
Trust, _Diagnosis and Management of Hypocalcaemia_, version 4, issued October 2024 and scheduled
for review October 2027. The registered source identifier is `YSTHFT-HYPOCALCAEMIA-V4`.

The supplied Tameside and Glossop Integrated Care NHS Foundation Trust Hypomagnesaemia document
was reviewed as separate supporting material. It is not the local York magnesium pathway cited by
the Hypocalcaemia source, contains an internal oral-dose conflict, and is not used to generate a
magnesium replacement dose in this pathway.

## Review inventory

| Definition                          | Version | Status                   | Purpose                                                               |
| ----------------------------------- | ------- | ------------------------ | --------------------------------------------------------------------- |
| `hypocalcaemia-source-assessment`   | `0.1.0` | Awaiting clinical review | Adjusted-calcium classification, symptoms, ECG and diagnostic context |
| `hypocalcaemia-causes-guardrails`   | `0.3.0` | Awaiting clinical review | Cause confirmation and treatment safeguards                           |
| `hypocalcaemia-management-branches` | `0.3.0` | Awaiting clinical review | Mild oral and severe symptomatic management branches                  |

The package contains this review document, a structured pending checklist, automated package and
boundary tests, component tests, end-to-end tests and representative desktop/mobile screenshots.

## Implemented pathway map

1. Confirm an adjusted calcium result and albumin adjustment.
2. Classify the source-defined severity without rounding across boundaries.
3. Collect the symptom, ECG, rapid-fall, renal, surgery and laboratory context progressively.
4. Select only a supported mild-asymptomatic or severe-symptomatic management branch.
5. Complete every cause and safeguard question before treatment becomes available.
6. Stop for missing external pathways, unresolved high-risk contexts or uncertain answers.
7. Show oral-calcium follow-up management or emergency intravenous-calcium management.
8. Preserve every treatment output behind the clinical-review warning and version badge.

The workflow never infers symptoms, causes, laboratory status, expert advice, renal context or a
need for continuous infusion from other answers.

## Threshold and branch review

| Input                                        | Implemented result              | Review point                                                                   |
| -------------------------------------------- | ------------------------------- | ------------------------------------------------------------------------------ |
| Adjusted calcium `< 1.9 mmol/L`              | Moderate/severe assessment band | Management requires at least one listed symptom and cleared safeguards         |
| Adjusted calcium `= 1.9 mmol/L`              | Mild assessment band            | No treatment branch because the management wording excludes the exact boundary |
| Adjusted calcium `> 1.9` and `<= 2.1 mmol/L` | Mild assessment band            | Oral branch requires no listed symptoms and no renal failure                   |
| Adjusted calcium `> 2.1` and `< 2.2 mmol/L`  | Source boundary gap             | Stop without assigning severity or treatment                                   |
| Adjusted calcium `>= 2.2 mmol/L`             | Does not meet source definition | Stop without treatment                                                         |
| Invalid, negative or over-precision value    | Validation error                | No branch is evaluated                                                         |

Values are compared at their entered precision and are not rounded into a source band.

## Assessment review

The assessment records whether albumin adjustment is confirmed, the rate of fall is rapid, listed
symptoms are present, listed ECG changes are present, and whether renal failure or recent surgery
applies. Diagnostic questions cover magnesium, phosphate, alkaline phosphatase, parathyroid
hormone and vitamin D. Because the source does not provide numeric thresholds for these tests, the
workflow records explicit local-laboratory states and does not invent cut-offs.

The source mentions ionised calcium for emergency measurement, but the printed severity bands are
for adjusted serum calcium. The implementation does not apply adjusted-calcium bands to an ionised
calcium result.

## Cause and safeguard review

| Context                                             | Implemented safeguard                                                                            |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Recent blood transfusion                            | Stops and directs the reviewer to the current massive-blood-loss pathway, which was not supplied |
| Rhabdomyolysis                                      | Requires explicit expert advice before management can continue                                   |
| Acute pancreatitis                                  | Records the confirmed context without inferring causality                                        |
| Renal failure                                       | Blocks unsupported mild management and constrains alfacalcidol/infusion decisions                |
| Dialysis or end-stage renal failure                 | Blocks continuous calcium infusion instructions                                                  |
| Parathyroidectomy with renal failure                | Requires renal-physician discussion                                                              |
| Hypomagnesaemia                                     | Identifies the cause but generates no replacement dose from a mismatched source                  |
| Hypoparathyroidism                                  | Separates postoperative from other confirmed contexts                                            |
| Vitamin D deficiency                                | Records the confirmed cause and retains source-derived management safeguards                     |
| Bisphosphonate, cytotoxic drug or denosumab context | Records an explicit medicine context without attributing causality automatically                 |

Uncertain answers stop or hold the pathway for clinical review instead of selecting a lower-risk
branch.

## Management review

### Mild asymptomatic branch

The source-derived branch offers Calcichew Forte without vitamin D as first-line oral calcium and
Sandocal for swallowing difficulty or intolerance. It then collects postoperative context and an
explicit follow-up adjusted calcium. The follow-up branches preserve the printed thresholds:

- below `1.9 mmol/L`: stop and require urgent clinical reassessment;
- `1.9` to `2.1 mmol/L`: increase oral calcium and consider the source-defined postoperative
  alfacalcidol branch only when its conditions are explicitly confirmed;
- above `2.1 mmol/L`: show the source-defined discharge statement and recheck calcium within one
  week.

The source does not provide a complete set of discharge criteria. The interface therefore labels
the output as a limited pathway statement rather than an independent discharge decision.

### Severe symptomatic branch

The emergency branch presents the source-derived initial intravenous calcium-gluconate action,
calcium-after-each-dose monitoring and ECG monitoring. A repeat dose is shown only when symptoms
are explicitly not resolved. Continuous infusion is never inferred: the user must confirm it is
required, and dialysis, end-stage renal failure or unresolved renal context blocks the instruction.

Every dose and administration statement remains unapproved pending clinical verification and the
missing calcium-gluconate monograph.

## Source map

| Source location                          | Implemented content                                                                                 |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Page 1, definition and severity          | Adjusted-calcium definition, moderate/severe band, mild band and fail-closed boundary gap           |
| Page 1, symptoms and ECG                 | Listed clinical symptoms, ECG-change context and rapid-fall question                                |
| Page 1, important questions              | Renal, surgery, magnesium, phosphate, ALP, PTH and vitamin-D assessment                             |
| Page 1, main causes                      | Cause prompts and transfusion/rhabdomyolysis safeguards                                             |
| Page 2, mild hypocalcaemia               | Oral calcium selection, postoperative monitoring, follow-up actions and limited discharge statement |
| Page 2, severe symptomatic hypocalcaemia | Emergency branch, IV calcium actions and response reassessment                                      |
| Page 2, underlying cause                 | Hypomagnesaemia, vitamin D, hypoparathyroidism and medicine-context safeguards                      |

Internal source identifiers and page details are retained in code and this reviewer artifact for
traceability. They are not displayed in the patient-facing workflow.

## Ambiguity and limitation register

| ID           | Unresolved item                                                                          | Implemented safety behavior                                          |
| ------------ | ---------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `HC-AMB-001` | Definition is below 2.2, but the printed mild band ends at 2.1                           | Results above 2.1 and below 2.2 stop as an unclassified source gap   |
| `HC-AMB-002` | Exact 1.9 is mild in assessment but excluded by both management inequalities             | No treatment branch is generated at exactly 1.9                      |
| `HC-AMB-003` | Rate of fall affects presentation without a numeric rapid-fall threshold                 | Requires an explicit clinician-confirmed status                      |
| `HC-AMB-004` | Diagnostic laboratory thresholds are absent                                              | Uses explicit local-reference states without invented numeric values |
| `HC-AMB-005` | Ionised calcium is mentioned without ionised severity bands                              | Does not classify an ionised result using adjusted-calcium bands     |
| `HC-AMB-006` | No approved reusable ECG image was supplied                                              | Shows a clearly labelled, unapproved schematic placeholder only      |
| `HC-AMB-007` | Massive-blood-loss guidance was referenced but not supplied                              | Transfusion-related cases stop before treatment                      |
| `HC-AMB-008` | The cited York magnesium pathway was not supplied and the available Trust source differs | No magnesium replacement dose is generated                           |
| `HC-AMB-009` | The calcium-gluconate monograph was not supplied                                         | IV instructions remain review-gated and unapproved                   |
| `HC-AMB-010` | Mild symptomatic and severe asymptomatic treatment are not defined                       | Both combinations stop as unsupported                                |
| `HC-AMB-011` | Continuous infusion is described as potentially required without selection criteria      | Requires an explicit clinical decision and renal-context check       |
| `HC-AMB-012` | The discharge line does not define complete discharge criteria                           | Labels it as a source-limited statement and requires review          |
| `HC-AMB-013` | Alfacalcidol selection, administration and follow-up need local approval                 | Preserves explicit questions and renal safeguards                    |
| `HC-AMB-014` | Source reuse/licensing has not been verified                                             | Package remains locked pending governance approval                   |
| `HC-AMB-015` | Rhabdomyolysis treatment detail is not defined in the supplied source                    | Stops until expert advice is explicitly recorded as obtained         |

## Representative clinical-review cases

| Case                              | Input summary                                                               | Expected review output                                                   |
| --------------------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Boundary below severe             | Adjusted calcium `1.899`, symptoms confirmed                                | Moderate/severe assessment; emergency branch only after safeguards clear |
| Exact lower mismatch              | Adjusted calcium `1.9`, no symptoms                                         | Mild assessment; no management instruction                               |
| Mild supported                    | Adjusted calcium `2.0`, no symptoms, no renal failure                       | Cause/safeguard review followed by oral-calcium branch                   |
| Definition gap                    | Adjusted calcium `2.15`                                                     | Unclassified source gap; no treatment                                    |
| Definition threshold              | Adjusted calcium `2.2`                                                      | Does not meet source definition; no treatment                            |
| Severe asymptomatic               | Adjusted calcium `1.8`, no listed symptoms                                  | Unsupported management state; no treatment instruction                   |
| Transfusion context               | Supported branch with recent transfusion confirmed                          | Stop for missing massive-blood-loss pathway                              |
| Rhabdomyolysis                    | Supported branch with advice not obtained                                   | Stop before treatment                                                    |
| Mild renal failure                | Adjusted calcium `2.0`, no symptoms, renal failure                          | Unsupported oral branch; no treatment instruction                        |
| Emergency response                | Adjusted calcium `1.85`, seizures, symptoms persist after initial treatment | Repeat source-derived IV action after cleared safeguards                 |
| Continuous infusion with dialysis | Emergency branch, infusion required, dialysis                               | Infusion instruction blocked                                             |
| Uncertain context                 | Any required answer marked unable                                           | Stop or hold for clinical review without inference                       |

## Automated evidence

- Clinical unit tests cover assessment boundaries, progressive disclosure and invalid inputs.
- Guardrail tests cover external-pathway stops, expert-advice requirements and renal safeguards.
- Management tests cover mild and emergency actions, follow-up thresholds and infusion exclusions.
- Package tests pin versions, source mappings, artifact availability and unresolved review status.
- Component tests cover connected state, interaction, warnings and responsive presentation.
- End-to-end tests exercise supported, unsupported and mobile workflows in a real browser.

## Screenshot evidence

- `connected-severe-management-desktop.png`: connected emergency management after completed
  assessment and safeguards.
- `mild-follow-up-desktop.png`: oral-calcium management and explicit follow-up result branch.
- `rhabdomyolysis-lock-mobile.png`: mobile safeguard stop before treatment is available.

Screenshots are review evidence only and do not constitute clinical approval.

## Privacy, accessibility and state review

The review route keeps assessment progress in React memory only. Refreshing or leaving the page
clears it; no assessment answer is saved in browser storage or sent to a server. Inputs use native
form semantics, keyboard-operable controls, visible focus states, explicit labels and text status
alongside colour. Desktop and mobile screenshots are included for layout review. This prototype
does not create a clinical record.

## Reviewer sign-off

Clinical reviewers should complete `review-checklist.csv`, resolve every ambiguity, record required
changes, and provide reviewer names, roles, dates and the governance decision. The manifest's
`approval` field must remain `null` until that process is complete. A code change and fresh
validation evidence are required for any approved revision.

**STOP HERE FOR CLINICAL REVIEW.**
