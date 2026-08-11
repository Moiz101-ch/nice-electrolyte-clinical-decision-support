# Hyponatraemia Fluid-Status Workflow

## Status

- Application pathway: `hyponatraemia-initial-assessment`
- Version: `0.2.0`
- Clinical review: `awaiting-clinical-review`
- Scope: cumulative sodium severity, fluid status and listed cerebral-oedema signs
- Management output: none

## Primary Source

- Source ID: `YSTHFT-HYPONATRAEMIA-EMERGENCY-V1`
- Organisation: York and Scarborough Teaching Hospitals NHS Foundation Trust
- Document: _Emergency Management of Hyponatraemia_
- Document version: `1.0`
- Source location: page 1, `Establish Fluid Status` and `Signs of cerebral oedema present?`
- Issue/review window: February 2025 to February 2028

This implementation is Trust-pathway-derived. It is not labelled as NICE management guidance.

## Decision Topology

The sodium severity branches converge on one fluid-status question:

| Fluid status               | Implemented next step                                      |
| -------------------------- | ---------------------------------------------------------- |
| Hypovolaemic               | Ask the source-listed cerebral-oedema sign question        |
| Euvolaemic                 | Ask the source-listed cerebral-oedema sign question        |
| Hypervolaemic              | Reach the source endpoint; management remains deferred     |
| Unable to establish safely | Stop for clinical review without selecting a source branch |

`Unable to establish safely` is an application safety state. It is not presented as a branch
printed in the source.

## Source-Listed Signs

- Nausea
- Vomiting
- Low GCS
- Ataxia
- Confusion
- Headache

At least one selected sign routes to the deferred emergency-management endpoint. An explicit
`None of the listed signs confirmed` answer routes to the volume-specific next step, whose clinical
content remains deferred to the next reviewed subtask.

## Edge-Case Behaviour

| Condition                                                 | Safe behavior                                                |
| --------------------------------------------------------- | ------------------------------------------------------------ |
| No fluid status selected                                  | Pause at the fluid-status question                           |
| Hypovolaemic or euvolaemic with no sign answer            | Pause at the sign question                                   |
| A listed sign and `none confirmed` are both submitted     | Block as an ambiguous branch                                 |
| Empty, duplicate or unknown sign values                   | Block as invalid input                                       |
| Unknown fluid status                                      | Block as invalid input                                       |
| Fluid status cannot be established                        | Stop for clinical review                                     |
| Fluid status changes                                      | Clear previous sign answers before evaluating the new branch |
| Hypervolaemic or uncertain state includes stale sign data | Ignore the unvisited sign input                              |
| Sodium does not match an exact source band                | Stop before fluid-status branching                           |

Every endpoint in version `0.2.0` has empty treatment, monitoring, warning and escalation output
collections. Emergency and management content is intentionally not implemented in this subtask.

## Clinical Review Questions

1. Are the three fluid-status labels and descriptions suitable for project use?
2. Should the source phrase `Signs of cerebral oedema present?` be retained exactly in the UI?
3. Is `None of the listed signs confirmed` an acceptable explicit negative answer?
4. Is the non-source `Unable to establish safely` stop state acceptable as a fail-closed safeguard?
5. Should any additional supporting observations be required before a volume state can be confirmed?
