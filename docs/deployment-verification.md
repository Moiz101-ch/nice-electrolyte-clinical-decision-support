# Deployment Verification Report

Verification date: 27 September 2026

## Outcome

The Cloudflare Workers deployment path passed its production build, package validation, public
deployment and smoke-test checks. The public deployment used Wrangler's temporary-account mode
because this workstation is not authenticated to the project's permanent Cloudflare account. It
was suitable for release verification, was not promoted as the permanent production service and
expires automatically if it is not claimed.

## Evidence

| Check                                  | Result                                    |
| -------------------------------------- | ----------------------------------------- |
| Next.js production build               | Pass                                      |
| OpenNext Cloudflare build              | Pass                                      |
| Wrangler deployment dry run            | Pass                                      |
| Temporary public Worker upload         | Pass                                      |
| Worker startup time                    | 20 ms                                     |
| Worker upload size                     | 8,424.77 KiB raw; 1,704.38 KiB compressed |
| Static assets discovered by dry run    | 50                                        |
| Local `workerd` health and route smoke | 20 of 20 passed                           |
| Public Worker health and route smoke   | 20 of 20 passed                           |
| Security and no-store header checks    | Pass                                      |
| Browser page-error checks              | Pass                                      |

The temporary deployment created Worker version
`da68181b-ecb9-4c93-aed3-ab48b65ecacd`. No permanent account deployment, custom domain, paid
binding or persistent data resource was created.

## Public Routes Verified

The smoke suite covers the home and assessment entry pages, the shared pathway UI review and all
public review routes for hyponatraemia, hyperkalaemia, hypocalcaemia, hypomagnesaemia and DKA. The
authoritative route list is maintained in `tests/e2e/deployment-smoke.spec.ts`.

## Repeat Verification

Build and test the Worker locally:

```bash
npm run cf:build
npm run cf:check
npm run test:deployment
```

Test a deployed Worker:

```bash
DEPLOYMENT_BASE_URL=https://<worker>.<subdomain>.workers.dev npm run test:deployment
```

Use the permanent account release and rollback procedure in `docs/cloudflare-deployment.md` before
assigning a stable production URL.
