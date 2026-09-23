# Performance Hardening Audit

Audit date: 23 September 2026. This work covers the active launcher pages and the four interactive
clinical workflows. It measures a local optimized Next.js production build; local results are a
repeatable regression signal, not a substitute for field Core Web Vitals from deployed users.

## Bundle analysis

The project uses the Next.js 16 Turbopack analyzer:

```powershell
npm.cmd run bundle:analyze
```

The report is written to `.next/diagnostics/analyze`, which remains excluded from Git with the rest
of `.next`. The review confirmed that interactive pathway code is split by route. The largest
client modules are the connected pathway components and their deterministic evaluators; no
unrelated pathway is intentionally loaded by a launcher page.

## Changes

- Disabled automatic prefetching on launcher links to clinical workflows. This prevents the home
  and assessment chooser from speculatively downloading every large pathway when only one will be
  selected.
- Replaced the full Fontsource package with one licensed, self-hosted Inter Latin variable-font
  subset through `next/font/local`. Next.js now preloads one 48 KiB file and supplies a
  layout-shift-adjusted fallback.
- Memoized repeated Hypocalcaemia management and Hyperkalaemia trace derivations so unrelated UI
  updates do not rerun the same deterministic work.
- Audited production dependencies. Every remaining runtime dependency has an active import and a
  defined application purpose; no unused runtime library remains.

## Production budgets

`tests/e2e/performance.spec.ts` runs against `next start` and checks the home page, assessment
chooser, Hyponatraemia, Hyperkalaemia, Hypocalcaemia and current DKA routes. Each route must remain
below these deliberately conservative regression limits:

| Metric                         | Budget      |
| ------------------------------ | ----------- |
| Decoded initial JavaScript     | `< 800 KiB` |
| Decoded CSS                    | `< 80 KiB`  |
| Total decoded resources        | `< 1.2 MiB` |
| Loaded font files              | `<= 1`      |
| Decoded font payload           | `< 60 KiB`  |
| Initial DOM elements           | `< 2,000`   |
| Cumulative Layout Shift        | `<= 0.1`    |
| Initial long tasks             | `<= 5`      |
| Local production DCL and LCP   | `< 5 s`     |
| Unselected workflow prefetches | `0`         |

Run the production check with:

```powershell
npm.cmd run test:performance
```

Timing checks use generous local limits to avoid treating CI hardware variance as a product
regression. Deployed real-user monitoring should eventually replace timing estimates with p75 Core
Web Vitals segmented by device and connection.

**STOP HERE FOR PERFORMANCE REVIEW.**
