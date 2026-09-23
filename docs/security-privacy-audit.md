# Security and Privacy Audit

Audit date: 20 September 2026. Scope: the active Next.js application, Cloudflare deployment
configuration, package lockfile, clinical review routes, health endpoint and repository controls.
This is a technical audit, **not approval to accept patient data or activate a clinical pathway**.

## Response security

`next.config.ts` sets a same-origin Content Security Policy (CSP), blocks object embedding and
framing, restricts form submissions and base URLs, and limits images, fonts and connections to
sources needed by the application. It also sets `X-Content-Type-Options: nosniff`,
`X-Frame-Options: DENY`, `Referrer-Policy: no-referrer`, a restrictive `Permissions-Policy`,
`X-DNS-Prefetch-Control: off` and `Cross-Origin-Opener-Policy: same-origin`. Production responses
add one-year HSTS; browsers only honour HSTS on HTTPS. Clinical review and assessment routes
return `Cache-Control: no-store`. The health endpoint already returns `no-store` and no clinical
information.

The CSP uses `'unsafe-inline'` for scripts and styles because this application retains Next.js
static rendering and inline hydration scripts. Next.js documents that a nonce-based strict CSP
requires dynamic rendering for the pages that use it. Development alone also permits
`'unsafe-eval'` and WebSocket connections for the Next.js tooling; production does not. This CSP
provides origin and embedding restrictions but is **not** a full XSS defence against injected
inline script. Before allowing patient data or active management output, assess a dynamic
nonce-based policy or another supported strict CSP and repeat browser compatibility testing.

The application does not configure permissive CORS headers. Browser and unit tests pin the
header contract and check the real HTTP responses. Cloudflare Worker preview or deployment must
be checked again because platform routing can alter response headers.

## Dependency review

An npm advisory scan initially found nine findings, including a critical advisory affecting the
installed Next.js version. Compatible updates now install Next.js `16.3.5`, Vitest and its
coverage package `4.1.11`, Wrangler `4.135.0`, Sharp `0.35.4`, `js-yaml` `4.3.2` and `qs`
`6.16.0`. `package-lock.json` records the resolved versions. The final `npm audit` reported
**zero known vulnerabilities** on the audit date. CI now runs `npm audit --audit-level=high` so
high and critical advisories block the build. An advisory scan is time-bound and does not prove
that dependencies are vulnerability-free; repeat it before deployment and after lockfile changes.

The relevant [Next.js security advisory](https://github.com/vercel/next.js/security/advisories/GHSA-p293-qw3h-jr36)
lists `16.3.3` as the first fixed 16.x release. The installed `16.3.5` is beyond that fix.

## Data flow and retention

- Review workflows keep answers in React memory only. Refreshing or leaving the page clears them.
  The connected DKA route starts from synthetic cases and permits editing numeric test values in
  local development. It has no identifier field, but it cannot prevent someone from entering real
  measurements; users must use synthetic data only.
- Active application code contains no `localStorage`, `sessionStorage`, IndexedDB, cookie writes,
  `sendBeacon`, analytics integration or database persistence. A regression test scans the
  application and clinical component code for those APIs.
- Clinical answers are not placed in URL query strings. DKA URLs carry only fixed synthetic case
  identifiers. The connected calculator keeps edited values in browser memory and does not submit
  them to a server. There is no patient-upload endpoint or assessment POST route.
- The health endpoint returns a fixed service/status response. It does not inspect or return
  clinical inputs.
- Browser refresh, browser history, extensions, screenshots, operating-system swap and endpoint
  monitoring remain outside this application's control. Users must not enter identifiable patient
  information into this unapproved prototype.

The previous Hypocalcaemia review document incorrectly claimed browser session storage; it now
matches the in-memory implementation.

## Logging and operational limits

The active app and clinical modules contain no calls to `console.log`, `console.error`,
`console.warn`, `console.debug` or `console.info`. A regression test protects this rule. The
source-registry CLI prints validation status and error messages, not assessments. Local Next.js
development may log request paths; the current DKA query values are synthetic IDs only.

Cloudflare, browser, reverse-proxy and operating-system logs have **not** been assigned or
verified retention periods by this repository. Before any patient-data feature or public clinical
deployment, an operator must review platform access logs, IP-address handling, request-body
logging, error reporting, retention, deletion and access controls. Never add clinical values to
URLs or logs. The Worker config disables Workers Logs persistence, Wrangler usage metrics and
dependency instrumentation by default. This does not control Cloudflare account-level logs,
real-time diagnostics, browser extensions or network intermediaries. No application telemetry,
alerting, authentication, consent or clinical-record integration is present; those omissions are
governance blockers, not assurances of privacy.

## Verification

```powershell
npm.cmd audit --audit-level=high
npm.cmd run sources:check
npm.cmd run typecheck
npm.cmd test -- tests/foundation/security-privacy.test.ts
npx.cmd playwright test tests/e2e/security-headers.spec.ts --project=chromium
```

Inspect the headers of `/`, `/assessment/new`, a `/review/` route and `/api/health` in the
production-like Cloudflare preview before deployment. Repeat the dependency, logging and
retention audit whenever patient data or external services are introduced.

Production browser tests assert that detailed DKA routes remain locked. Their separate synthetic
technical-review tests require a local development server and `PLAYWRIGHT_DKA_PREVIEW=1`.

**STOP HERE FOR SECURITY AND PRIVACY REVIEW.**
