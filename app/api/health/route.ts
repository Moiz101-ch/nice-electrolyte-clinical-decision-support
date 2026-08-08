const healthResponse = {
  status: "ok",
  service: "nice-electrolyte-clinical-decision-support",
} as const;

export const dynamic = "force-dynamic";

export function GET() {
  return Response.json(healthResponse, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
