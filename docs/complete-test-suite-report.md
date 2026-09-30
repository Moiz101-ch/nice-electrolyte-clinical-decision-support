# Complete Test Suite Report

Verification date: 27 September 2026.

This report closes Subtask 29. It covers deterministic pathway behavior, branch and boundary
handling, source traceability, production browser behavior, accessibility, performance and build
integrity. Passing these checks verifies the software implementation; it does not constitute
clinical approval or authorize patient use.

## Single verification command

```powershell
npm.cmd run test:complete
```

The command stops at the first failed gate and runs:

1. formatting, linting and strict TypeScript checks;
2. immutable clinical-source registry and file-integrity verification;
3. unit, pathway, branch and boundary tests with coverage thresholds;
4. the optimized Next.js production build;
5. production Playwright tests, including accessibility, performance and security checks;
6. the separate development-only DKA review suite;
7. the Cloudflare/OpenNext production bundle build;
8. the Wrangler deployment-package dry run; and
9. the public-route smoke suite against local `workerd`.

## Coverage gates

Coverage is enforced in `vitest.config.ts`; falling below any threshold fails CI.

| Metric     | Required | Verified baseline |
| ---------- | -------: | ----------------: |
| Statements |      90% |            90.84% |
| Branches   |      80% |            82.61% |
| Functions  |      90% |            94.64% |
| Lines      |      90% |            91.63% |

The baseline is informational. The configured thresholds, rather than frozen percentages, are the
regression gate.

## Test inventory

| Layer                    | Files | Primary responsibility                                             |
| ------------------------ | ----: | ------------------------------------------------------------------ |
| Clinical/pathway         |    30 | Rules, calculations, branches, boundaries and fail-closed behavior |
| Components/design system |    17 | Interaction, conditional rendering and accessible controls         |
| Foundation/application   |    16 | Routes, layout, security, migration and production gating          |
| Playwright E2E           |    23 | Complete workflows, responsive behavior and HTTP contracts         |

## Pathway and boundary evidence

| Workflow      | Representative automated coverage                                                                                                                                                                                     |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Hyponatraemia | Sodium bands and gaps; osmolality boundaries; mutually exclusive signs; fluid-state, emergency-response, ODS-risk and cause branches; stale-answer reset; source-supported result isolation                           |
| Hyperkalaemia | Potassium bands; ECG combinations and uncertainty; calcium, glucose and salbutamol contexts; timed management; recurrence prevention; ambiguous-input blocking                                                        |
| Hypocalcaemia | Severity gaps; symptoms and diagnostic branches; renal, surgery and medicine guardrails; severe and mild management; follow-up thresholds; unresolved-context blocking                                                |
| DKA           | Diagnostic alternatives; blood-pressure and potassium boundaries; weight calculations; glucose support; ketone/bicarbonate/glucose trends; urine-output targets; resolution and transition; malformed-input rejection |
| Shared engine | Input shape, units, precision, inclusive/exclusive numeric boundaries, multi-select ambiguity, cycles, calculations, source collection and immutable snapshots                                                        |

Every clinical workflow includes explicit unsupported or uncertain cases. Tests assert that these
states do not inherit actions from a different branch.

## Source traceability

- `npm run sources:check` validates registry metadata and verifies each registered local file by
  path, byte size and SHA-256 digest.
- All 11 declarative production pathway definitions are validated against the full schema and
  clinical source registry during the test run.
- Node, action, warning, monitoring and escalation references must point to a source declared by
  the pathway and to a page within that source.
- Every current JBDS DKA calculator stage carries machine-readable source ID and source-location
  metadata. These internal references remain absent from clinician-facing screens.
- Clinical review-package tests cross-check manifest source lists and executable references.

## Browser profiles

The optimized production suite verifies all public and gated routes, complete interactive
workflows, keyboard behavior, responsive layouts, automated accessibility, motion preferences,
security headers and performance budgets. Development-only historical DKA review routes are not
made public merely to test them; `npm run test:e2e:dka-preview` starts a temporary development
server and exercises their ten dedicated tests separately.

## Verified result

| Gate                                  | Result                                 |
| ------------------------------------- | -------------------------------------- |
| Formatting, ESLint and TypeScript     | Pass                                   |
| Immutable source integrity            | Pass: 9 files verified                 |
| Unit/component/foundation tests       | Pass: 403 tests                        |
| Coverage thresholds                   | Pass                                   |
| Next.js production build              | Pass                                   |
| Production Playwright suite           | Pass: 87 tests; 10 profile-gated skips |
| Development-only DKA Playwright suite | Pass: all 10 complementary tests       |
| Cloudflare/OpenNext build             | Pass                                   |
| Wrangler deployment dry run           | Pass                                   |
| Local Worker deployment smoke         | Pass: 20 tests                         |

## Residual limits

- Browser automation currently targets Chromium; keyboard and responsive checks cover multiple
  viewport sizes but are not a substitute for assistive-technology testing on every platform.
- Performance timings are local regression budgets, not deployed real-user Core Web Vitals.
- Tests use synthetic technical cases and cannot validate clinical suitability.
- Permanent deployment still requires credentials for the target Cloudflare account.

**STOP HERE FOR COMPLETE TEST-SUITE REVIEW.**
