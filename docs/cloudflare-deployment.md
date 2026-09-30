# Cloudflare Workers Deployment

The application is configured for Cloudflare Workers through the OpenNext Cloudflare adapter.
Local preview runs in Cloudflare's `workerd` runtime and does not require Cloudflare credentials.

## Release Gate

Run the complete local release gate before uploading a version:

```bash
npm ci
npx playwright install chromium
npm run test:complete
```

The final stages build the OpenNext Worker, validate the deployable package with Wrangler and run
the public-route smoke suite against local `workerd`. To repeat only those stages:

```bash
npm run cf:build
npm run cf:check
npm run test:deployment
```

To smoke-test an already deployed Worker instead of starting a local preview:

```bash
DEPLOYMENT_BASE_URL=https://<worker>.<subdomain>.workers.dev npm run test:deployment
```

In PowerShell, set `DEPLOYMENT_BASE_URL` for the current process before running the command. The
suite verifies `/api/health`, every public workflow route, security headers, no-store headers on
clinical pages and the absence of browser page errors.

## Local Development And Preview

Use the Next.js development server for normal application work:

```bash
npm run dev
```

Build and run a production-like local Worker preview:

```bash
npm run preview
```

The preview defaults to `http://localhost:8787`. The health endpoint should return HTTP 200 with a
`status` value of `ok` and `Cache-Control: no-store`.

## Environment Variables

- `.env.example` documents variables used by Next.js development and builds.
- `.dev.vars.example` documents local Worker runtime variables. Copy it to the ignored `.dev.vars`
  file before previewing when runtime variables are required.
- Do not commit `.env`, `.dev.vars`, API tokens, patient data or other secrets.
- Set non-secret production values in `wrangler.jsonc` only when they are safe to publish.
- Set production secrets with `npx wrangler secret put <NAME>` or in the Cloudflare dashboard.
- `NEXT_PUBLIC_` variables are embedded into browser assets at build time and must never contain
  secrets.

No environment variable or external Cloudflare binding is required by the current application.

## Free Public Deployment

1. Create or use a Cloudflare account on the Workers Free plan.
2. Authenticate with `npx wrangler login`, or configure `CLOUDFLARE_API_TOKEN` in CI.
3. Run the release gate and inspect the generated package measurements.
4. Confirm `wrangler.jsonc` still contains `workers_dev: true` and no paid bindings.
5. Upload a version without sending traffic to it:

   ```bash
   npm run upload
   npx wrangler versions list
   ```

6. Test the generated version preview URL with the remote smoke command.
7. Send all traffic to the verified version:

   ```bash
   npx wrangler versions deploy <VERSION_ID>@100% --message "Release <VERSION_ID>"
   ```

8. Repeat the remote smoke test against the stable `workers.dev` URL.

The current configuration uses only the Worker, OpenNext's self-reference service binding and the
static-assets binding. It does not enable R2, D1, KV, Workers AI, Cloudflare Images or a custom
domain. As verified on 27 September 2026, Cloudflare documents 100,000 Worker requests per day and
10 ms CPU time per invocation on the Free plan, while static asset requests are free and unlimited.
Cloudflare limits and pricing can change, so re-check the official documentation before release:

- <https://developers.cloudflare.com/workers/platform/pricing/>
- <https://developers.cloudflare.com/workers/platform/limits/>

## Rollback

Before every release, record the currently active version and deployment:

```bash
npx wrangler deployments list
npx wrangler versions list
```

If post-deployment smoke checks fail, stop further rollout and restore the recorded version:

```bash
npx wrangler rollback <PREVIOUS_VERSION_ID> --message "Rollback after failed smoke checks" --yes
```

Then run the remote smoke suite against the stable URL and record the restored deployment ID. If a
release used gradual traffic splitting, it can instead be returned explicitly to the previous
version with `npx wrangler versions deploy <PREVIOUS_VERSION_ID>@100%`.

Cloudflare retains only a bounded history of versions. Rollback changes Worker code and
configuration, but it does not undo changes to external resources or stored data. The current
deployment has no persistent data binding, but future releases must include a separate data and
binding rollback plan before adding one. See Cloudflare's rollback behavior and limitations:

- <https://developers.cloudflare.com/workers/versions-and-deployments/rollbacks/>

## Operational Notes

- `npm run build` verifies the standard Next.js production build.
- `npm run cf:build` creates `.open-next/`, which is generated and ignored by Git.
- `npm run cf:check` validates Wrangler packaging without deploying.
- `npm run cf:typegen` validates bindings and creates ignored local types.
- `npm run test:deployment` starts and stops local `workerd`; it leaves no development server.
- The health endpoint confirms application availability, not clinical correctness.
- Never log clinical note text, patient identifiers, secrets or complete assessment payloads.
- `wrangler.jsonc` disables Worker log persistence and Wrangler telemetry for this project. Do not
  enable either without an approved logging and retention policy.
- Cloudflare account-level access-log and error-retention settings are outside this repository and
  must be reviewed before accepting patient information.
