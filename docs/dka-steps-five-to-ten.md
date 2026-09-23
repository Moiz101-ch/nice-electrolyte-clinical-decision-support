# DKA Steps 5-10 Technical Preview

Subtask 24 connects the supplied York Teaching Hospital adult DKA pathway's later stages to the
fixed synthetic Steps 1-4 cases. The local development route is
`/review/dka/steps-five-to-ten`. Public builds show a locked gate, not treatment details or
patient-entry controls. This is not approved for patient care.

The deterministic evaluator checks prerequisites before entering Step 5. It maps further
assessment and critical-care criteria, fluid cautions and the source's standard sequence,
potassium and monitoring branches, the weight-based oliguria threshold, and one-hour response
targets. Missing measurements and unresolved branches stop progression. The selected initial
synthetic case survives forward and backward navigation. The fixed later scenarios cover fluid
cautions, low and high potassium, inadequate response, and insulin-regimen mapping.

**Hard stop:** the numbered pathway and hourly chart disagree on DKA resolution criteria. The
evaluator therefore never declares DKA resolved, never authorises transition to subcutaneous
insulin, and never generates a treatment-stop instruction. The Step 10 regimen mapping is isolated
for source review; it is not connected to clinical execution. The source's insulin escalation text
also needs reconciliation with the Step 4 rate maximum, so no adjusted dose is calculated.

Clinical review must confirm source currentness, resolve internal conflicts, verify each
transcription and calculation, and approve display and use before activation. The newer
[JBDS 02 adult DKA guideline](https://abcd.care/resource/current/jbds-02-management-diabetic-ketoacidosis-adults)
is a comparator, not a silent substitute for the supplied Trust pathway.

## Verification

```powershell
npm.cmd test -- tests/clinical/dka-steps-five-to-ten.test.ts tests/design-system/dka-steps-five-to-ten-review.test.tsx tests/foundation/dka-technical-preview-production-gate.test.tsx
npx.cmd playwright test tests/e2e/dka-steps-five-to-ten.spec.ts --project=chromium
```
