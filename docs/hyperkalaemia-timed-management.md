# Hyperkalaemia Timed Management

## Governance

- Application pathway: `hyperkalaemia-timed-management`
- Version: `0.3.0`
- Status: `awaiting-clinical-review`
- Review route: `/review/hyperkalaemia/assessment`
- Clinical use: prohibited until formal review and approval

## Source

- Registry ID: `YSTHFT-ACUTE-HYPERKALAEMIA-V1`
- Organisation: York and Scarborough Teaching Hospitals NHS Foundation Trust
- Document: Management of Acute Hyperkalaemia in Adults
- Source version: `1.0`
- First issue: November 2023
- Review due: November 2026
- Relevant pages: prescribing chart on page 1 and management algorithm on page 2

The source PDF remains immutable under `clinical-sources/hyperkalaemia/`. Runtime logic is separate
from the source file, and each graph node retains an internal page and section reference.

## Connected Flow

The `0.3.0` graph extends the severity and ECG workflows without creating a separate state boundary:

1. Confirm potassium and select the exact source severity band.
2. Run initial checks; request ECG findings from `6.0 mmol/L`.
3. For a listed ECG change, show cardiac escalation and request digoxin-toxicity context before
   selecting the calcium administration consideration.
4. For severe Hyperkalaemia, continue to pre-treatment capillary blood glucose and the source
   insulin/glucose branch even when no listed ECG change is present.
5. Apply the `<7.0 mmol/L` pre-treatment glucose threshold without rounding.
6. Request the salbutamol caution context and generate only the compatible source instruction.
7. Show condition-dependent escalation and adjunct wording, severity-specific monitoring, and
   cause/recurrence prevention.
8. End at an explicit clinical-review stop.

Changing potassium clears ECG and every downstream answer. Changing ECG clears calcium, glucose and
salbutamol answers. Changing the calcium context clears glucose and salbutamol answers. Changing
pre-treatment glucose clears the salbutamol answer.

## Deterministic Boundaries

- Mild `5.5-5.9 mmol/L`: daily potassium, capillary glucose, cause review and prevention only.
- Moderate `6.0-6.4 mmol/L` with a listed ECG change: ECG escalation, calcium context and active
  timed-management branch.
- Moderate `6.0-6.4 mmol/L` without a listed ECG change: no acute drug instruction is inferred. The
  source says management depends on clinical condition, ECG and rate of rise but gives no
  deterministic selection criteria.
- Severe `>=6.5 mmol/L`: emergency timed-management branch.
- `>=7.0 mmol/L` with uncertain ECG status: retain the no-delay calcium safeguard and require the
  digoxin-toxicity context.
- Pre-treatment glucose `0-6.99 mmol/L`: insulin/glucose plus the source follow-on glucose
  consideration.
- Pre-treatment glucose `>=7.0 mmol/L`: insulin/glucose without that follow-on instruction.
- Inputs are not rounded. Values outside the printed potassium bands remain unsupported.

## Source Conflict

The protocol contains materially different sodium-zirconium initiation wording:

- Page 1 says to prescribe at `>=6.5 mmol/L` and consider prescribing at `>=6.0 mmol/L`, with daily
  review and stopping at `<=5.0 mmol/L`.
- Page 2 describes `10 grams TDS for 72 hours` in life-threatening Hyperkalaemia, without defining
  that term in the supplied document.

The application records both references, displays a clinician-facing conflict warning, generates no
automated sodium-zirconium regimen, and prevents the pathway from being marked clinically approved
until the conflict is explicitly resolved.

## Safety And Edge Cases

- ECG no-change and uncertainty states are exclusive from listed ECG changes.
- An unknown or empty ECG selection blocks or pauses the graph.
- Digoxin uncertainty does not select a calcium duration.
- Tachycardia generates an avoid-salbutamol warning and no salbutamol action.
- Ischaemic heart disease selects only the source lower-dose consideration.
- Unknown salbutamol context generates no salbutamol instruction.
- Wrong units, non-finite values, negative glucose values and excess decimal precision are blocked.
- Stale downstream inputs are ignored when their branch is not reached.
- Internal source IDs, PDF names and page numbers are not displayed in the clinician-facing UI.

## Review Evidence

- [Confirmed ECG and timed-management branch, desktop](screenshots/subtask-14-hyperkalaemia/timed-management-desktop.png)
- [Critical ECG and medication-context uncertainty branch, mobile](screenshots/subtask-14-hyperkalaemia/timed-management-uncertain-mobile.png)

## Deferred Clinical Decisions

Clinical review must resolve or confirm:

1. The sodium-zirconium initiation criteria and the intended definition of life-threatening
   Hyperkalaemia.
2. Whether the active treatment branch should collect additional structured clinical-condition and
   rate-of-rise inputs for moderate Hyperkalaemia.
3. Whether the calcium repeat wording and the duplicated prescribing-chart rows represent one
   repeat consideration or a separate prescribing intent.
4. Whether the supplied source remains current after its November 2026 review date.

The formal pathway map, review checklist, branch evidence and screenshot bundle belong to Subtask 15.
