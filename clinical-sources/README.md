# Immutable Clinical Sources

This directory contains the original clinical documents and reference diagrams supplied for the
revised pathway project. The files under the pathway folders are source evidence, not runtime
clinical data.

## Immutability Policy

- Do not edit, optimise, rename, recompress or regenerate the supplied files in place.
- Do not import PDFs or images directly into the clinical decision engine.
- Store structured source metadata separately in the source registry introduced in Subtask 1.
- Store executable pathway definitions separately from these originals.
- Record a new source as a new file and registry version rather than replacing an existing file.
- Verify source integrity with SHA-256 after copying or moving an original.
- Do not expose a source publicly until its provenance and reuse position have been reviewed.

## Supplied Files

| Area            | Original file                                                                     | SHA-256                                                            |
| --------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| Hyponatraemia   | `hyponatraemia-pathway.pdf`                                                       | `C3021A2159D18F5629A5CA40995B7123E769C07B4F9728B41AAAA414AE46E646` |
| Hyponatraemia   | `WhatsApp Image 2026-08-09 at 12.01.45 PM.jpeg`                                   | `EBFCD8E82C715A5FF9E1A3359D49ED1C9A5098FB5D85263FFA1E288CEAD6C39D` |
| Hyponatraemia   | `WhatsApp Image 2026-08-09 at 11.57.48 AM.jpeg`                                   | `905B46C1DAEA97FDDA2864FC5965B2A3D95B0013867792B82E053A29B8410B15` |
| Hyperkalaemia   | `ps01173-protocol-for-management-of-acute-hyperkalaemia-in-adults-fy11000403.pdf` | `812308761523594CD02CFAC4A567FC70C1156B0BD93DAD3A5D8EEFB01D20886D` |
| Hypocalcaemia   | `hypocalcaemia-diagnosis-management-v4-oct-24-oct-27.pdf`                         | `76A7349CE1B1A704D10E6A18B388881CBCA083553F647EB809DB533D6848B348` |
| Hypomagnesaemia | `Hypomagnesaemia_NHS_Guidelines (1).pdf`                                          | `95EB0F9487541BCE9935210A4B8E4C36A667762CC14A5292B39E55AE3DBA5164` |
| DKA             | `Diabetic-Ketoacidosis--DKA--in-Adults-Pathway-v9-May-19---Apr-21-1.pdf`          | `9DC7D5F7078CB2143FFF0CA7BAF59F99B9D0FD6D2E6151D55DA1B7555DC117D9` |
| DKA             | `JBDS_02_DKA_Guideline_March_2023.pdf`                                            | `568323C1BB8B554190162DDF0E4E605B0E14F092757FB60927A5CC5B0F164EE8` |

The diagrams have no visible author, organisation, date, version, approval or reuse metadata. They
must remain unapproved supporting references until provenance and clinical ownership are confirmed.

## Directory Roles

- `hyponatraemia/`: emergency management pathway and diagnostic-classification references.
- `hyperkalaemia/`: acute adult management protocol and prescribing chart.
- `hypocalcaemia/`: diagnosis and acute-management pathway.
- `hypomagnesaemia/`: draft supporting guidance linked for evidence review only; it does not drive
  a standalone pathway or magnesium treatment instructions.
- `dka/`: historical York pathway and separately registered current JBDS 02 guidance. The current
  JBDS calculator is available for technical testing; it is not an active clinical pathway.
- `supporting/`: reserved for approved supporting material that is not a primary pathway source.

The complete source and repository audit is in
[`docs/subtask-0-repository-source-audit.md`](../docs/subtask-0-repository-source-audit.md).
