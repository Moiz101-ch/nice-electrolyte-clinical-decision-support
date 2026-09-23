# Cloudflare Workers Deployment

The application is configured for Cloudflare Workers through the OpenNext Cloudflare adapter.
Local preview runs in Cloudflare's `workerd` runtime and does not require Cloudflare credentials.
Public deployment is intentionally deferred until the approved public-deployment subtask.

## Local Development And Preview

Use the Next.js development server for normal application work:

```bash
npm run dev
```

Build the Worker output without starting a server:

```bash
npm run cf:build
```

Build and run a production-like local Worker preview:

```bash
npm run preview
```

The preview defaults to `http://localhost:8787`. Verify both `/` and `/api/health`; the health
endpoint should return HTTP 200 with `{"status":"ok",...}` and `Cache-Control: no-store`.

## Environment Variables

- `.env.example` documents variables used by Next.js development and builds.
- `.dev.vars.example` documents local Worker runtime variables. Copy it to the ignored
  `.dev.vars` file before previewing when runtime variables are required.
- Do not commit `.env`, `.dev.vars`, API tokens, patient data, or other secrets.
- Set non-secret production values in `wrangler.jsonc` only when they are safe to publish.
- Set production secrets with `npx wrangler secret put <NAME>` or in the Cloudflare dashboard.
- `NEXT_PUBLIC_` variables are embedded into browser assets at build time and must never contain
  secrets.

No environment variable or Cloudflare binding is required by the current health endpoint.

## Free Deployment

1. Create or use a Cloudflare account that remains on the Workers Free plan.
2. Authenticate the local CLI with `npx wrangler login`.
3. Confirm `wrangler.jsonc` has `workers_dev: true` and contains no paid service bindings.
4. Run `npm run deploy`.
5. Open the resulting `https://<worker>.<subdomain>.workers.dev` address and verify `/api/health`.

The current configuration uses only the Worker, OpenNext's self-reference service binding, and the
static-assets binding. It does not enable R2, D1, KV, Workers AI, Cloudflare Images, a custom domain,
or another paid product. Cloudflare's Workers Free plan is currently advertised at USD 0 with no
credit card required. It includes 100,000 Worker requests per day and 10 ms CPU time per invocation;
static asset requests are free and unlimited. When a free-plan request limit is exceeded, requests
fail rather than automatically converting this repository to paid usage. Cloudflare pricing and
limits can change, so re-check the official documentation before every public deployment and ensure
the account has not been upgraded to Workers Paid.

## Upload And Rollback

For a staged release, upload a version without routing traffic:

```bash
npm run upload
npx wrangler versions deploy
```

Inspect active deployments and versions before rollback:

```bash
npx wrangler deployments list
npx wrangler versions list
```

Roll back interactively to a previously deployed version:

```bash
npx wrangler rollback
```

Rollback changes Worker code and configuration but does not restore or alter external resources.
Review binding and data compatibility before rolling back a future release that uses storage.

## Operational Notes

- `npm run build` verifies the standard Next.js production build.
- `npm run cf:build` creates `.open-next/`, which is generated and ignored by Git.
- `npm run cf:typegen` validates bindings and creates the ignored local `cloudflare-env.d.ts` file.
- `npm run preview` is the required production-runtime check before deployment.
- The health endpoint confirms that the application Worker is responding; it is not a clinical
  validation signal and does not inspect patient data or external services.
- Never log clinical note text, patient identifiers, secrets, or complete assessment payloads.
- `wrangler.jsonc` disables Worker log persistence and Wrangler telemetry for this prototype.
  Do not enable either without an approved logging and retention policy.
- Verify CSP and security headers on HTML and API responses in a production-like Worker preview.
  Clinical review and assessment pages must return `Cache-Control: no-store`.
- Cloudflare access-log and error-retention settings are not configured by this repository. Review
  them before accepting patient information or enabling clinical workflows.
