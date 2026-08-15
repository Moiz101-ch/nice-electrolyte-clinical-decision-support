import { ArrowLeft, ArrowRight, Clock3, FileCheck2, ShieldAlert } from "lucide-react";
import type { Metadata, Route } from "next";
import Link from "next/link";

import { AppShell } from "@/components/layout/app-shell";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Pathway status",
};

const pathwayStatuses = [
  {
    name: "Hyponatraemia",
    status: "Connected technical review available; clinical approval pending",
  },
  {
    name: "Hyperkalaemia",
    status: "Connected severity and ECG review available; timed management pending",
  },
  {
    name: "Hypocalcaemia",
    status: "Source registered; pathway implementation pending",
  },
] as const;

const technicalReviews = [
  {
    description: "Connected assessment and source-supported management endpoints.",
    href: "/review/hyponatraemia/assessment",
    name: "Hyponatraemia",
  },
  {
    description: "Connected potassium severity, initial checks and source-listed ECG workflow.",
    href: "/review/hyperkalaemia/assessment",
    name: "Hyperkalaemia",
  },
] as const;

export default function NewAssessmentPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-4xl space-y-8">
        <header>
          <Badge variant="review">
            <Clock3 aria-hidden="true" className="size-3.5" />
            Migration in progress
          </Badge>
          <h1 className="text-foreground mt-4 text-2xl font-bold sm:text-[1.75rem]">
            Clinical pathways are under review
          </h1>
          <p className="text-muted mt-3 max-w-3xl text-sm leading-6 sm:text-base">
            The retired generic assessment and catalogue cannot generate management output. New
            pathway-specific assessments will become available only after source transcription,
            technical verification and clinical review.
          </p>
        </header>

        <Alert title="No active clinical assessment" variant="warning">
          Do not use this application for diagnosis, treatment or management decisions. Follow an
          approved local pathway and current clinical escalation procedures.
        </Alert>

        <section aria-labelledby="technical-reviews-title" className="border-border border-y py-6">
          <div>
            <h2 className="text-foreground text-base font-semibold" id="technical-reviews-title">
              Technical pathway reviews
            </h2>
            <p className="text-muted mt-1 max-w-2xl text-sm leading-6">
              Implemented stages remain separated from active clinical use until formal review.
            </p>
          </div>

          <div className="border-border mt-5 divide-y border-y">
            {technicalReviews.map((review) => (
              <div
                className="grid gap-4 py-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
                key={review.name}
              >
                <div>
                  <h3 className="text-foreground text-sm font-semibold">{review.name}</h3>
                  <p className="text-muted mt-1 text-sm leading-6">{review.description}</p>
                </div>
                <Button asChild variant="outline">
                  <Link href={review.href as Route}>
                    Open {review.name} review
                    <ArrowRight aria-hidden="true" />
                  </Link>
                </Button>
              </div>
            ))}
          </div>
        </section>

        <section aria-labelledby="pathway-status-title" className="border-border border-y py-6">
          <div className="flex items-start gap-3">
            <FileCheck2
              aria-hidden="true"
              className="text-primary mt-0.5 size-5 shrink-0"
              strokeWidth={1.8}
            />
            <div className="min-w-0 flex-1">
              <h2 className="text-foreground text-base font-semibold" id="pathway-status-title">
                Target pathway status
              </h2>
              <dl className="border-border mt-4 divide-y border-y">
                {pathwayStatuses.map((pathway) => (
                  <div
                    className="grid gap-1 py-4 sm:grid-cols-[11rem_minmax(0,1fr)]"
                    key={pathway.name}
                  >
                    <dt className="text-foreground text-sm font-semibold">{pathway.name}</dt>
                    <dd className="text-muted text-sm leading-5">{pathway.status}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </section>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Button asChild variant="secondary">
            <Link href="/">
              <ArrowLeft aria-hidden="true" />
              Return home
            </Link>
          </Button>
          <p className="text-muted flex max-w-md items-start gap-2 text-xs leading-5">
            <ShieldAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            No patient data is requested or stored on this page.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
