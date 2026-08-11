# Hyponatraemia Sodium Severity

## Status

- Application pathway: `hyponatraemia-sodium-severity`
- Version: `0.1.0`
- Clinical review: `awaiting-clinical-review`
- Scope: sodium input, unit validation and severity classification only
- Management output: none

## Primary Source

- Source ID: `YSTHFT-HYPONATRAEMIA-EMERGENCY-V1`
- Organisation: York and Scarborough Teaching Hospitals NHS Foundation Trust
- Document: _Emergency Management of Hyponatraemia_
- Document version: `1.0`
- Source location: page 1, severity classification row
- Issue/review window: February 2025 to February 2028

This implementation is Trust-pathway-derived. It is not labelled as NICE management guidance.

## Source Bands

| Classification | Printed source band |
| -------------- | ------------------- |
| Severe         | `<125 mmol/L`       |
| Moderate       | `125–129 mmol/L`    |
| Mild           | `130–135 mmol/L`    |

The thresholds exist once in
`src/clinical/pathways/hyponatraemia/severity.ts`. React components consume the deterministic
evaluation result and do not implement thresholds.

## Input Contract

- Unit must be exactly `mmol/L`.
- Value must be finite and greater than zero.
- At most one decimal place is accepted.
- No patient value is stored by the review route.

## Boundary Behaviour

| Sodium value  | Result                                     |
| ------------- | ------------------------------------------ |
| `124.9`       | Severe                                     |
| `125`         | Moderate                                   |
| `129`         | Moderate                                   |
| `129.1–129.9` | Unsupported: no exact printed band matched |
| `130`         | Mild                                       |
| `135`         | Mild                                       |
| `>135`        | Unsupported by this hyponatraemia table    |

The gap between `129` and `130` is not silently reconciled. It remains fail-closed pending explicit
clinical confirmation of how decimal laboratory results should be handled.

## Clinical Review Questions

1. Should values greater than `129` and less than `130 mmol/L` be classified as moderate?
2. Is one decimal place the correct accepted reporting precision for every target laboratory?
3. Should an additional clinically plausible input range be enforced before classification?
4. Are the severity labels and source wording suitable for project use?
