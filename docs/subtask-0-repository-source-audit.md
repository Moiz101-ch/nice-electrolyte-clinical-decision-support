# Subtask 0 Repository and Source Audit

Audit date: `2026-08-10`

Status: `Complete, awaiting project-owner approval`

## Scope and Boundary

This audit covers the existing repository, all five supplied clinical PDFs, both supplied
hyponatraemia diagrams, the revised 2,235-line implementation specification, and the external
MDCalc interaction reference named in that specification.

No new clinical pathway, dose, calculation, result, route or user-interface redesign was
implemented. Existing clinical logic was not deleted or silently changed. The only source changes
were byte-identical copies into `clinical-sources/` and preservation of the revised specification in
`project-input/updated-implementation-specification.txt`.

## Executive Findings

1. The current application is a well-tested technical prototype, but its clinical architecture is
   the legacy architecture under the revised specification.
2. Its management flow is a generic four-electrolyte, eight-abnormality form backed by a 17-rule
   NICE-only catalogue. The new product instead requires three pathway-specific Trust workflows.
3. The current TypeScript rule engine is deterministic, but rules and source metadata are coupled to
   NICE IDs and flat catalogue outputs. It cannot represent interactive nodes, timed actions,
   monitoring, conflicts, source status or review governance without replacement.
4. The 1,000 synthetic cases do not train the engine, but they remain coupled to catalogue parity,
   extraction tests and demos. They must be archived or reduced to source-derived boundary fixtures.
5. The current extraction feature is a deterministic parser, not an ML model. It is optional under
   the revised scope and should be archived until the three primary pathways pass clinical review.
6. The design tokens, UI primitives, accessibility foundation, testing stack, CI, health route and
   Cloudflare/OpenNext deployment are reusable.
7. The supplied clinical documents are not one homogeneous evidence set. They differ in Trust,
   version, review status, completeness and provenance. No supplied pathway is clinically approved
   for this application merely because it has been implemented or copied.
8. The DKA document is past its April 2021 review date. The classification diagrams have no source
   metadata. These are hard approval blockers.

## Supplied Clinical Source Audit

All files below were read in full and visually inspected page by page.

| Proposed source ID                                | Source and pages                                       | Metadata found                                                                                                                                                                                                                             | Intended role                                              | Initial status                         |
| ------------------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------- | -------------------------------------- |
| `YSTHFT-HYPONATRAEMIA-EMERGENCY-V1`               | `hyponatraemia-pathway.pdf`, page 1                    | York and Scarborough Teaching Hospitals NHS Foundation Trust; Medicine Care Group; owner Dr T Pawlak; version 1.0; February 2025 to February 2028                                                                                          | Primary hyponatraemia emergency-management pathway         | Awaiting clinical review               |
| `UNVERIFIED-HYPONATRAEMIA-CLASSIFICATION-DIAGRAM` | polished WhatsApp diagram, single image                | No organisation, author, issue date, version, approval or reuse metadata                                                                                                                                                                   | Supporting diagnostic classification                       | Draft, provenance blocked              |
| `UNVERIFIED-HYPONATRAEMIA-CLASSIFICATION-CAPTURE` | table screenshot, single image                         | No organisation, author, issue date, version, approval or reuse metadata                                                                                                                                                                   | Apparent source/capture of the same classification content | Draft, provenance blocked              |
| `YSTHFT-ACUTE-HYPERKALAEMIA-V1`                   | `ps01173...pdf`, pages 1 to 2                          | York and Scarborough Teaching Hospitals NHS Foundation Trust; authors Tasnim Momoniat, Matt Cooke and Okkar Myint Zaw; version 1.0; first issued November 2023; review November 2026; PS01173; approved by Drug and Therapeutics Committee | Primary acute-hyperkalaemia pathway                        | Awaiting clinical review               |
| `YSTHFT-HYPOCALCAEMIA-V4`                         | `hypocalcaemia...pdf`, pages 1 to 2                    | York and Scarborough Teaching Hospitals NHS Foundation Trust; authors T Pawlak and C Jones; version 4; October 2024 to October 2027                                                                                                        | Primary hypocalcaemia pathway                              | Awaiting clinical review               |
| `TGICFT-HYPOMAGNESAEMIA-UNDATED`                  | `Hypomagnesaemia_NHS_Guidelines (1).pdf`, pages 1 to 5 | Tameside and Glossop Integrated Care NHS Foundation Trust; authors Dr Harris Rathur, Dr Ali Zafar and Dr Alina Nazir; no visible version, issue date, review date or approval record                                                       | Supporting guidance linked from hypocalcaemia              | Draft, metadata blocked                |
| `YTH-DKA-V9-2019`                                 | `Diabetic-Ketoacidosis...pdf`, pages 1 to 4            | York Teaching Hospital NHS Foundation Trust; owner/author Dr Jonathan Thow; co-author Liz Jackson; Patient Safety version 9, May 2019; order code PS00493; review April 2021                                                               | Future DKA pathway/calculator source                       | Superseded-date risk, approval blocked |

### Source Scope Notes

- The hyperkalaemia document's page 1 is mainly an administration and prescribing chart. Page 2 is
  the clinician-facing decision pathway and should drive future interaction design.
- The DKA source includes patient-identification fields for paper records. The public application
  must not reproduce or request those identifiers.
- The hypomagnesaemia file is supporting material only in the current roadmap.
- The MDCalc Cockcroft-Gault page is an external product-interaction reference only. It is not a
  clinical source, runtime dependency or required calculator.
- Existing NICE links may remain supporting references when mapped accurately, but Trust content
  must not be labelled as NICE management guidance.

## Clinical Ambiguities and Review Blockers

These issues must be recorded in the source registry or pathway review package. They must not be
silently reconciled in code.

### Hyponatraemia Emergency Pathway

1. The source defines mild as `130-135`, moderate as `125-129` and severe as `<125`. A doctor must
   confirm whether the endpoints are intended to include decimal values exactly as written.
2. The source says severe symptomatic patients at high risk of osmotic demyelination syndrome need
   hourly monitoring, but it does not define the high-risk criteria.
3. The flowchart refers to a separate SIADH pathway, but that source was not supplied. Only a
   compatible-pattern stop state can be implemented.
4. The hypovolaemia/euvolaemia arrows around hypertonic saline, cause management and the `add on if
hypovolaemic` normal-saline box need a clinician-confirmed branch transcription.
5. The phrase `symptomatic improvement OR Na increased by more than 5 mmol` needs confirmation
   against the stated target of `4-6 mmol` before an exact stop condition is encoded.
6. The source says `blood samples prior to treatment (if possible)`. Urine availability therefore
   cannot block immediate management when it is not required by the emergency branch.

### Hyponatraemia Classification Diagrams

1. Both images lack provenance, clinical owner, approval, date, version and reuse permission.
2. Serum osmolality uses `<275`, approximately `275-295`, and `>295`. Exact behaviour at `275` and
   `295` requires confirmation.
3. Urine sodium uses `<40` and `>40`; an exact value of `40` is not assigned.
4. Urine osmolality uses `<100` and `>100`; an exact value of `100` is not assigned.
5. Urine sodium is labelled `mEq/L`; the future unit model must preserve the source unit and avoid an
   undocumented conversion assumption.
6. The diagrams identify cause patterns, not definitive diagnoses. SIADH must remain a compatible
   pattern pending a dedicated approved pathway.

### Acute Hyperkalaemia

1. Page 1 has two calcium-gluconate administration rows, while page 2 says to consider a further dose
   if adverse ECG changes remain after five minutes. The intended repeat-dose workflow must be
   confirmed.
2. Page 1 says prescribe sodium zirconium when potassium is `>=6.5` and consider it at `>=6.0`; page 2
   visually marks it recommended for severe hyperkalaemia. The moderate branch needs explicit review.
3. The source calls sodium zirconium treatment for `life threatening hyperkalaemia`, while severity is
   numerically `>=6.5`. A clinician must confirm whether ECG/clinical features alter that label.
4. The protocol cites UK Kidney Association guidance but that referenced source was not supplied as
   an immutable project source.
5. Review is due in November 2026, so a review-status warning will soon be required.
6. ECG examples for the application need licensed or project-approved visual assets.

### Hypocalcaemia

1. Hypocalcaemia is `<2.2`; the severity table says mild `1.9-2.1` and moderate/severe `<1.9`. Exact
   decimal handling between `2.1` and `<2.2`, and at `1.9`, needs confirmation.
2. The source says severity depends on symptoms and rate of fall. The exact interaction between the
   numeric class and the `severe symptomatic medical emergency` branch requires clinical review.
3. The source references an IV monograph, massive-blood-loss guidance and hypomagnesaemia guidance.
   The first two were not supplied.
4. ECG images embedded in the PDF cannot be reused separately until their licence or internal reuse
   permission is confirmed.
5. Renal failure, dialysis, rhabdomyolysis, parathyroidectomy, digoxin and dysrhythmia warnings require
   explicit branch and escalation review.
6. Local formulary product choices and doses require confirmation for project use even though they
   are present in the supplied Trust pathway.

### Hypomagnesaemia Supporting Guidance

1. No version, issue date, review date or approval body is visible.
2. The narrative says one to two Magnaspartate sachets daily. The flowchart says 10 mmol twice daily,
   up to 24 mmol/day. This internal dose discrepancy blocks approval.
3. The flowchart contains additional administration and renal-impairment detail not fully reproduced
   in the narrative. It must be transcribed and reviewed as a conflict-aware source, not merged by
   assumption.
4. It is a supporting source only and must not delay the three primary pathways.

### DKA

1. The review date passed in April 2021. The module cannot be represented as current or activated
   without a newer approved source or explicit clinical approval.
2. Step 9 says DKA resolves only when both ketone and pH/bicarbonate criteria are met. The monitoring
   chart uses `AND/OR` wording that could be read differently. This must be resolved clinically.
3. All medication, fluid, potassium and insulin calculations require current-source confirmation,
   including the 15-unit/hour maximum.
4. The source mentions pregnancy, older adults, heart failure and renal failure as caution contexts
   but does not provide a complete digital branch for each.
5. The paper pathway contains local contact numbers and patient-record fields that are not suitable
   for the public application.

## Current Repository Architecture

### Runtime Flow

```text
project-input NICE JSON/CSV
  -> scripts/build-runtime-data.ts
  -> data/runtime NICE JSON
  -> src/rule-engine/catalogue.ts
  -> context-specific TypeScript evaluators
  -> components/assessment/assessment-workflow.tsx
  -> components/results/assessment-result.tsx
```

The form first selects electrolyte, abnormality, age, pregnancy status and a generic clinical
context. It then asks context questions, builds a validated assessment, evaluates the flat catalogue
and displays a locked NICE result or a generic unsupported result.

### Current Clinical Data

| File/group                                                  | Current role                                     | Revised-spec conflict                                                 |
| ----------------------------------------------------------- | ------------------------------------------------ | --------------------------------------------------------------------- |
| `project-input/nice_electrolyte_rule_catalogue.json`        | Authoritative 17-rule NICE catalogue             | Wrong future source model and flat output structure                   |
| `project-input/nice_electrolyte_management_rules.csv`       | Exact CSV mirror of the catalogue                | Duplicates obsolete flat model                                        |
| `project-input/nice_electrolyte_synthetic_cases.csv`        | 1,000 cases: 700 train, 150 validation, 150 test | Too broad and coupled to legacy expected outputs                      |
| `project-input/nice_electrolyte_resource_search_config.csv` | Eight-condition evidence-search configuration    | NICE-only and broad-condition assumptions are obsolete                |
| `project-input/nice_electrolyte_project_package.xlsx`       | Legacy packaged catalogue and sample cases       | Historical artifact, not a future authority                           |
| `data/runtime/*.json`                                       | Generated camel-case NICE runtime data           | Must be replaced by validated source registry and pathway definitions |
| `project-input/NICE_Electrolyte_Project_Execution_Guide.md` | Previous execution plan                          | Superseded by the new preserved specification                         |

The synthetic cases are not used to infer current rules. They are read by parity tests, one
deterministic-extraction test, extraction demos and the synchronization script. Those dependencies
must be removed safely before the dataset is archived.

### Current Rule Engine

- `src/clinical-data/*` validates NICE-only source IDs, URLs and catalogue rows.
- `src/rule-engine/assessment.ts` defines one large assessment object and fixed clinical contexts.
- `src/rule-engine/hyperkalaemia.ts` and `remaining-rules.ts` contain hard-coded evaluators.
- `src/rule-engine/engine.ts` orders evaluators by context and fails safely.
- `src/rule-engine/result-builder.ts` resolves NICE sources and returns flat management text.
- `src/rule-engine/explanation.ts` builds a deterministic explanation.

The fail-safe evaluator pattern and deterministic explanation idea are reusable. The NICE-specific
types, flat result and context-dispatch design are not.

### Current Assessment and Results

- Route: `/assessment/new`.
- One five-step form serves every electrolyte and condition.
- Age and pregnancy are always requested.
- A generic context selector determines a large question set.
- The result UI provides priority, confirmed information, one management block, rationale,
  limitations and NICE source links.
- The unsupported branch is safe, but it is too generic for pathway-specific stop states.

### Current Extraction and AI Position

There is no model, transformer package, LLM API or model download. `src/extraction/*` is a
deterministic regular-expression and dictionary parser that extracts candidate values and reports
conflicts. It never selects a rule. The feature is nevertheless lower priority under the revised
roadmap and is coupled to the synthetic dataset through a test and demos.

### Current Test and Delivery Foundation

- Vitest, Testing Library and jsdom cover data, engine, form, result and UI primitives.
- Playwright and axe-core cover browser workflows, responsive behaviour, hydration and automated
  accessibility checks.
- GitHub Actions runs formatting, lint, type checking, data checks, tests, build, Playwright and a
  Cloudflare build.
- Next.js 16, React 19, strict TypeScript, Zod and Tailwind CSS are current foundations.
- OpenNext and Wrangler provide a free Cloudflare Workers deployment path.
- The app has no database and does not persist assessment values.

## Migration Classification

No item is deleted during Subtask 0.

| Classification     | Files/components                                                                                                                       | Reason and dependency note                                                                                          |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| RETAIN             | `package.json` core framework/test dependencies, `next.config.ts`, `vitest.config.ts`, `playwright.config.ts`, `scripts/run-e2e.mjs`   | Suitable technical foundation; scripts may need naming updates later                                                |
| RETAIN             | `.github/workflows/ci.yml`, `open-next.config.ts`, `wrangler.jsonc`, `.dev.vars.example`, `public/_headers`, `app/api/health/route.ts` | Working CI, health and free deployment foundation                                                                   |
| RETAIN             | `app/error.tsx`, `app/loading.tsx`, `app/not-found.tsx`                                                                                | Generic application states remain useful                                                                            |
| RETAIN             | `components/ui/*`, `app/globals.css`, `lib/utils.ts`                                                                                   | Accessible primitives, semantic tokens and restrained visual foundation are reusable                                |
| REFACTOR           | `app/layout.tsx`, `components/layout/*`                                                                                                | Keep shell mechanics and mobile dialog; replace NICE branding, obsolete links and disabled history items            |
| REPLACE            | `app/page.tsx`, `public/clinical-electrolyte-hero.webp`                                                                                | Homepage scope and marketing-style presentation conflict with pathway-first product direction                       |
| REPLACE            | `app/assessment/new/page.tsx`, `components/assessment/*`, `src/assessment/structured-assessment.ts`                                    | Generic form, demographics and context selector conflict with pathway-specific progressive disclosure               |
| REFACTOR           | `components/results/assessment-result.tsx`                                                                                             | Reuse accessible section patterns, but replace flat NICE result with operational pathway timeline and source status |
| REPLACE            | `src/clinical-data/*`, `src/rule-engine/*`, `data/runtime/*`                                                                           | NICE-only schemas and flat evaluators cannot represent the new source/pathway model                                 |
| ARCHIVE            | `project-input/nice_electrolyte_*`, old project guide and workbook                                                                     | Preserve historical provenance after all runtime/test dependencies are removed                                      |
| ARCHIVE            | `scripts/build-runtime-data.ts`, `sync-synthetic-case-expectations.ts`, rule demos                                                     | Coupled to the legacy catalogue and synthetic expectations                                                          |
| ARCHIVE            | `src/extraction/*`, extraction demo/docs/tests                                                                                         | Optional deferred feature; preserve until the three primary pathways are reviewed                                   |
| REFACTOR           | Existing unit/component/E2E tests                                                                                                      | Retain test infrastructure; replace clinical expectations with source-derived pathway boundaries                    |
| ARCHIVE            | NICE-only implementation docs under `docs/`                                                                                            | Historical design evidence; superseded by source-registry and pathway documentation                                 |
| REMOVE             | Disabled `My assessments` and generic `Additional resources` navigation entries                                                        | No feature or storage exists; remove when navigation is redesigned                                                  |
| REVIEW THEN REMOVE | `requirements.txt`, Python setup in CI                                                                                                 | Only supports the old spreadsheet/data workflow; remove only after legacy artifact tooling is archived              |

## Proposed Clinical Source Registry

Subtask 1 should implement a Zod-validated, version-controlled registry with no clinical branching.
Each source record should include:

```text
sourceId
sourceKind: clinical-pathway | supporting-guidance | diagram | product-reference
organisation
title
authors[]
owner
documentVersion
issueDate
reviewDate
pageCount
localPath
sha256
provenanceStatus
reuseStatus
clinicalReviewStatus
supersedes / supersededBy
supportingReferences[]
notes[]
```

Required review statuses are:

```text
draft
awaiting-clinical-review
changes-requested
clinically-reviewed
approved-for-project-use
superseded
```

Unknown metadata must remain `null` or an explicit unknown state. It must never be guessed from a
filename. The registry validator should fail on duplicate IDs, missing files, hash mismatches,
invalid dates, impossible review ranges and unsupported status transitions.

## Proposed Declarative Pathway Schema

Subtask 2 should implement the schema and engine foundation without adding a clinical pathway. A
pathway definition should contain:

```text
pathwayId
name
version
status
sourceIds[]
entryNodeId
nodes[]
reviewMetadata
```

Proposed node types:

```text
information
single-choice-question
multi-select-question
numeric-input
numeric-branch
boolean-branch
action-group
warning
monitoring
escalation
calculation
stop
```

Every branch must use typed operators and explicit inclusive/exclusive boundaries. Every numeric
input must declare its unit, precision and accepted range. Every action, warning, monitoring item and
escalation must reference a source ID, page and source node/section.

The engine should return a deterministic snapshot containing:

```text
pathway/version
current node and branch
confirmed inputs
derived classifications
immediate actions
next actions
monitoring
warnings
escalations
source references
deterministic explanation
clinical review status
```

Pathway data must not contain executable JavaScript or free-form expressions. React components must
render engine output and must not contain clinical thresholds.

## Migration Strategy

1. Implement the source registry while the current application remains operational.
2. Implement the generic declarative schema and safe engine with no clinical thresholds.
3. Remove runtime and test dependencies on the old synthetic/catalogue architecture, then move those
   artifacts to a clearly marked historical archive.
4. Redesign navigation and the homepage around the three approved target modules, with unavailable
   modules visibly gated by review status.
5. Build reusable pathway controls and result sections before adding clinical logic.
6. Implement hyponatraemia from numeric classification through emergency management and diagnostic
   classification, then stop for a formal clinical-review package.
7. Do not begin hyperkalaemia until hyponatraemia is explicitly approved after clinical review.
8. Repeat the gated process for hyperkalaemia and hypocalcaemia.
9. Link hypomagnesaemia only as supporting guidance after its metadata and discrepancy are reviewed.
10. Gate DKA on source currentness before implementing or activating its calculator.
11. Preserve CI, accessibility, privacy, deterministic execution and free Cloudflare deployment
    throughout the migration.

## Roadmap Confirmation

The supplied Subtasks 1 through 31 remain in the requested order. No major reordering is recommended.
The following controls should be applied within that sequence:

- Subtask 1 records unverified diagrams and expired sources without approving them.
- Subtask 2 includes source-reference validation, conflict records and review-status gating in the
  foundation.
- Subtask 3 archives rather than destroys historical data and removes every dependency before moving
  a file.
- Subtasks 6 to 11 use the emergency pathway as primary and the diagrams as blocked supporting
  material until provenance and exact-boundary questions are resolved.
- Subtasks 11, 15, 19 and 25 are hard clinical-review gates.
- Subtask 21 must obtain a current DKA source or explicit clinical decision before activation work.

## Resulting Repository Tree

```text
clinical-sources/
|-- README.md
|-- dka/
|   `-- Diabetic-Ketoacidosis--DKA--in-Adults-Pathway-v9-May-19---Apr-21-1.pdf
|-- hyperkalaemia/
|   `-- ps01173-protocol-for-management-of-acute-hyperkalaemia-in-adults-fy11000403.pdf
|-- hypocalcaemia/
|   `-- hypocalcaemia-diagnosis-management-v4-oct-24-oct-27.pdf
|-- hypomagnesaemia/
|   `-- Hypomagnesaemia_NHS_Guidelines (1).pdf
|-- hyponatraemia/
|   |-- WhatsApp Image 2026-08-09 at 11.57.48 AM.jpeg
|   |-- WhatsApp Image 2026-08-09 at 12.01.45 PM.jpeg
|   `-- hyponatraemia-pathway.pdf
`-- supporting/
    `-- README.md

project-input/
`-- updated-implementation-specification.txt

docs/
`-- subtask-0-repository-source-audit.md
```

All existing application, data, test and deployment files remain in place pending approved migration
subtasks.

## Decision

The repository is technically suitable for incremental migration. It is not suitable for direct
clinical-pathway expansion on top of the current NICE-only catalogue. The safe path is to preserve
the working infrastructure, introduce the source registry and declarative engine alongside it, and
retire the legacy clinical architecture only after replacement tests and review gates exist.
