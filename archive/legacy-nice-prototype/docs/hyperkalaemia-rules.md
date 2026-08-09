# Hyperkalaemia Rules

The catalogue activates eight deterministic NICE hyperkalaemia pathways:

| Rule                              | Exact selection condition                                                                                                                                                             |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NICE-K-HYPER-IV-001`             | Potassium `>5.5 mmol/L`, current IV fluids, confirmed temporal relationship, no identified alternative cause, and completed prescription/medicine review.                             |
| `NICE-K-CKD-MONITOR-001`          | Confirmed CKD with a RAAS antagonist starting or dose increasing, known eGFR and known change date.                                                                                   |
| `NICE-K-CKD-PRETREAT-001`         | Confirmed CKD, planned RAAS antagonist, and pretreatment potassium `>5.0 mmol/L`.                                                                                                     |
| `NICE-K-CKD-STOP-001`             | Confirmed CKD, current RAAS antagonist, potassium `>=6.0 mmol/L`, and other hyperkalaemia-promoting medicines stopped.                                                                |
| `NICE-K-SZC-ELIG-001`             | Confirmed potassium `>=5.5 mmol/L`, CKD stage 3b to 5 or heart failure, any non-optimised RAAS status caused by hyperkalaemia, and no dialysis.                                       |
| `NICE-K-BINDER-OPTIONS-001`       | Confirmed potassium `>=6.0 mmol/L`, CKD stage 3b to 5 or heart failure, RAAS therapy absent or reduced because of hyperkalaemia, and no dialysis; returns both eligible NICE options. |
| `NICE-K-ACUTE-BINDER-OPTIONS-001` | Clinically confirmed acute life-threatening hyperkalaemia in emergency care, with standard emergency care underway; returns binder options only as additions to standard care.        |
| `NICE-K-AKI-RRT-001`              | Confirmed AKI and failure to respond to medical management after potassium trend, treatments, clinical condition, ECG/complications and fluid status are reviewed.                    |

The acute binder rule intentionally has no numeric cutoff because TA1148 and TA623 require a
clinically confirmed acute life-threatening presentation rather than defining one by a potassium
value. The AKI rule also intentionally has no potassium threshold. It requires confirmed failure of medical
management and a completed whole-condition review; an isolated high value cannot select it.

Missing required confirmations return a `blocked` result. Confirmed facts that do not satisfy the
catalogue conditions return the source-free `NICE-UNSUPPORTED-001` safety result. The engine never
fills absent facts or broadens the catalogue wording.

Run representative outputs with:

```bash
npm run hyperkalaemia:demo
```

The mappings were rechecked against the official NICE pages on 2026-08-09; see
`docs/nice-evidence-audit.md`. These rules retain the
catalogue's `Pending` clinical-review status and are not approved for real clinical use.
