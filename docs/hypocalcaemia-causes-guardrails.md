# Hypocalcaemia Cause and Safeguard Review

Subtask 18 adds a mandatory deterministic review between completed Hypocalcaemia assessment and
treatment display. The `hypocalcaemia-causes-guardrails` definition is version `0.3.0` and remains
`awaiting-clinical-review`.

## Review Flow

1. Confirm or exclude recent blood transfusion. A confirmed or uncertain association stops because
   the separate massive-blood-loss pathway named by the source was not supplied.
2. Confirm or exclude rhabdomyolysis. Correction remains locked unless expert advice is explicitly
   confirmed.
3. Record acute pancreatitis as a source-listed association without inferring causation.
4. Record cytotoxic drug, bisphosphonate and denosumab exposure using explicit present, none or
   uncertain states.
5. Resolve detailed renal status, including CKD, end-stage renal failure and dialysis.
6. Resolve recent surgery as total thyroidectomy, parathyroidectomy, other operation, none or
   uncertain.
7. Require Duty Renal Physician discussion for parathyroidectomy with renal failure.
8. Confirm hypoparathyroidism, vitamin D deficiency or hypomagnesaemia as causes independently of
   suggestive laboratory patterns.
9. For severe symptomatic management, resolve dysrhythmia and digoxin context before intravenous
   calcium. Confirmed dysrhythmia or digoxin therapy adds continuous ECG monitoring.

## Cause Actions

- Confirmed post-operative hypoparathyroidism or another confirmed hypoparathyroidism cause exposes
  the source's approximate 1-alfacalcidol starting dose and follow-up calcium schedule.
- Renal patients require confirmed renal-physician discussion before 1-alfacalcidol output.
- Intravenous 1-alfacalcidol is limited to confirmed absorption concerns or difficulty with oral
  administration.
- Confirmed vitamin D deficiency as the cause exposes oral vitamin D without inventing a dose.
- Confirmed hypomagnesaemia as the cause exposes underlying-cause treatment without inventing a
  magnesium dose. It also exposes a read-only link to the separately registered supporting source;
  the supporting document remains outside the executable pathway.

## Fail-Closed Behaviour

Contradictory upstream and detailed answers are invalid. Uncertain blood-transfusion,
rhabdomyolysis, surgery, renal, cause, cardiac-monitoring and expert-review states stop the relevant
output. Resetting the safeguard review clears treatment-stage answers. The workflow remains an
unapproved technical preview and cannot be used for patient care.
