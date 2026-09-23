# DKA Source-Currentness Gate

Subtask 21 records the supplied adult DKA pathway for technical and clinical review without
activating a calculator or patient workflow.

## Registered Source

- Organisation: York Teaching Hospital NHS Foundation Trust
- Title: Guideline for the Management of Diabetic Ketoacidosis (DKA) in Adults
- Version: Patient Safety version 9
- Issue date: May 2019
- Stated review date: April 2021
- Registry status: draft
- Reuse status: internal verification only
- Currentness at the registry audit date: review overdue

The original PDF remains unchanged under `clinical-sources/dka/`. The application does not call it
current and does not expose the internal source identifier or PDF page references in the review UI.

## Activation Gate

`evaluateDkaSourceCurrentnessGate()` fails closed unless every requirement is satisfied:

1. Source currentness is established by a non-overdue source or a matching clinical decision.
2. The internal resolution-criteria conflict is removed from source governance.
3. The registry status is `approved-for-project-use`.
4. A dated clinical approval matches the exact source identifier and SHA-256 hash.
5. Public-display reuse is approved.

The current source fails all five requirements. A matching approval record alone cannot activate
the module while the registry, conflict and reuse blockers remain.

## Source Workflow Map

The review map covers every numbered source stage:

1. Initial assessment
2. Confirm the diagnosis
3. Initial fluid resuscitation
4. Start fixed-rate IV insulin infusion
5. Further assessment
6. Fluid replacement
7. Further monitoring
8. Assess response to treatment
9. Target of treatment: resolution of ketoacidosis
10. Conversion to subcutaneous insulin

The separate adult DKA hourly monitoring chart is catalogued as a supplementary source section.
The map is immutable and separate from the executable pathway engine.

## Identified Rules

The source transcription records these future deterministic targets without executing them:

- diagnostic confirmation logic;
- systolic-pressure fluid branching;
- weight-based initial insulin rate and source maximum;
- critical-care escalation thresholds;
- timed fluid-replacement sequence;
- glucose, potassium, oxygen and urine-output monitoring branches;
- weight-based oliguria threshold;
- hourly ketone, bicarbonate and glucose trends;
- DKA resolution logic; and
- IV-to-subcutaneous insulin transition timing.

The resolution rule remains blocked. The numbered pathway and hourly chart use different AND/OR
relationships and different bicarbonate boundary wording. Clinical reviewers must state the
intended rule before it is implemented.

## Review Route

Open `/review/dka/source-currentness` from the DKA module on the homepage. The route is read-only:
it accepts no patient measurements, performs no calculations, records no approval and offers no
treatment navigation. It links to `/review/dka/calculator`, where the technical foundation can be
reviewed without weakening this gate.

## Verification

```bash
npm run sources:check
npm test -- tests/clinical/dka-source-currentness.test.ts
npm test -- tests/design-system/dka-source-currentness-review.test.tsx
npx playwright test tests/e2e/dka-source-currentness.spec.ts --project=chromium
```

The source-currentness gate remains authoritative after the Subtask 23 technical preview. Detailed
DKA review pages render only on local development servers while public-display reuse is restricted;
production pages show the locked gate. No DKA treatment stage is active.
