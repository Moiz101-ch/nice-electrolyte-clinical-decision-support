import { Activity, ArrowLeft, ArrowRight, Calculator, HeartPulse, Zap } from "lucide-react";
import type { Metadata, Route } from "next";
import Link from "next/link";

import { SafetyAlert } from "@/components/clinical";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Choose an assessment" };

const workflows = [
  {
    description: "Connected sodium classification, clinical context and management branches.",
    href: "/review/hyponatraemia/assessment",
    icon: Activity,
    name: "Hyponatraemia",
  },
  {
    description: "Potassium result, ECG findings, timed actions and ongoing monitoring.",
    href: "/review/hyperkalaemia/assessment",
    icon: Zap,
    name: "Hyperkalaemia",
  },
  {
    description: "Adjusted calcium, symptoms, investigations and management safeguards.",
    href: "/review/hypocalcaemia/assessment",
    icon: HeartPulse,
    name: "Hypocalcaemia",
  },
  {
    description: "JBDS-based DKA diagnosis, fluids, insulin, response and transition calculator.",
    href: "/review/dka/current-calculator",
    icon: Calculator,
    name: "Diabetic ketoacidosis",
  },
] as const;

export default function NewAssessmentPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-5xl space-y-7">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Badge variant="info">4 interactive workflows</Badge>
            <h1 className="text-foreground mt-4 text-2xl font-bold">Choose an assessment</h1>
          </div>
          <Button asChild variant="secondary">
            <Link href="/">
              <ArrowLeft aria-hidden="true" />
              Home
            </Link>
          </Button>
        </header>

        <SafetyAlert level="warning" title="Technical use only">
          These workflows are available for software testing. They are not approved for patient
          care. Do not enter patient-identifiable information; use an approved local pathway for
          clinical decisions.
        </SafetyAlert>

        <section aria-labelledby="available-workflows-title">
          <h2 className="text-foreground text-base font-semibold" id="available-workflows-title">
            Available workflows
          </h2>
          <div className="border-border divide-border mt-3 divide-y border-y">
            {workflows.map(({ description, href, icon: Icon, name }) => (
              <div
                className="motion-workflow-row grid gap-4 px-3 py-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
                key={href}
              >
                <div className="flex min-w-0 items-start gap-3">
                  <span className="bg-info-subtle text-primary flex size-10 shrink-0 items-center justify-center rounded-md">
                    <Icon aria-hidden="true" className="size-5" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-foreground text-sm font-semibold">{name}</h3>
                    <p className="text-muted mt-1 text-sm leading-6">{description}</p>
                  </div>
                </div>
                <Button asChild variant="secondary">
                  <Link aria-label={`Open ${name} workflow`} href={href as Route} prefetch={false}>
                    Open workflow
                    <ArrowRight aria-hidden="true" />
                  </Link>
                </Button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
