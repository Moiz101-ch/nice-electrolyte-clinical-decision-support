import { Activity, ArrowLeft, ClipboardCheck, GitBranch, ShieldAlert } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import {
  MonitoringTimeline,
  PathwayProgress,
  ResultSection,
  ReviewStatusBadge,
  SafetyAlert,
} from "@/components/clinical";
import { AppShell } from "@/components/layout/app-shell";
import { PathwayControlExamples } from "@/components/pathways/pathway-ui/control-examples";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Pathway UI review",
};

const progressSteps = [
  { description: "Pathway selected", id: "focus", label: "Assessment focus" },
  { description: "Current preview step", id: "findings", label: "Clinical findings" },
  { description: "Not yet reached", id: "context", label: "Clinical context" },
  { description: "No result generated", id: "result", label: "Result" },
] as const;

const monitoringItems = [
  {
    description: "Baseline observations and source context have been recorded.",
    id: "baseline",
    label: "Initial assessment",
    status: "complete" as const,
    timing: "At presentation",
  },
  {
    description: "The active pathway would define the applicable reassessment interval.",
    id: "repeat",
    label: "Repeat observations",
    status: "current" as const,
    timing: "Interval pending pathway logic",
  },
  {
    description: "Response criteria must come from a reviewed pathway definition.",
    id: "response",
    label: "Review response",
    status: "upcoming" as const,
    timing: "After reassessment",
  },
] as const;

export default function PathwayUiReviewPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-6xl space-y-9">
        <header className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="info">Internal review</Badge>
              <ReviewStatusBadge status="draft" />
            </div>
            <h1 className="text-foreground mt-4 text-2xl font-bold sm:text-[1.75rem]">
              Shared pathway UI framework
            </h1>
            <p className="text-muted mt-2 max-w-3xl text-sm leading-6">
              Common assessment and result patterns are available for technical and clinical review
              before pathway-specific rules are introduced.
            </p>
          </div>
          <Button asChild variant="secondary">
            <Link href="/">
              <ArrowLeft aria-hidden="true" />
              Return home
            </Link>
          </Button>
        </header>

        <Alert title="UI review only — no clinical output" variant="warning">
          Values and selections on this page are illustrative. They are not evaluated, stored or
          converted into management recommendations.
        </Alert>

        <section aria-labelledby="progress-title">
          <div className="mb-4">
            <p className="text-primary text-xs font-bold uppercase">Assessment framework</p>
            <h2 className="text-foreground mt-1 text-lg font-bold" id="progress-title">
              Pathway progress
            </h2>
          </div>
          <PathwayProgress currentStepId="findings" steps={progressSteps} />
        </section>

        <section aria-labelledby="controls-title" className="border-border border-y py-7">
          <div>
            <p className="text-primary text-xs font-bold uppercase">Input framework</p>
            <h2 className="text-foreground mt-1 text-lg font-bold" id="controls-title">
              Clinical assessment controls
            </h2>
          </div>

          <PathwayControlExamples />
        </section>

        <section aria-labelledby="safety-title">
          <div>
            <p className="text-primary text-xs font-bold uppercase">Safety framework</p>
            <h2 className="text-foreground mt-1 text-lg font-bold" id="safety-title">
              Safety alerts
            </h2>
          </div>
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <SafetyAlert level="warning" title="Verify the active source">
              Confirm the source version, current local policy and review status before relying on
              any future pathway output.
            </SafetyAlert>
            <SafetyAlert level="critical" title="Use emergency escalation procedures">
              If a patient is acutely unwell, follow approved local emergency procedures and seek
              senior clinical support.
            </SafetyAlert>
          </div>
        </section>

        <section className="border-border border-y py-7">
          <MonitoringTimeline items={monitoringItems} title="Monitoring timeline" />
        </section>

        <section aria-labelledby="result-title">
          <div>
            <p className="text-primary text-xs font-bold uppercase">Result framework</p>
            <h2 className="text-foreground mt-1 text-lg font-bold" id="result-title">
              Structured result sections
            </h2>
          </div>
          <div className="mt-5 space-y-3">
            <ResultSection
              headingAs="h3"
              icon={GitBranch}
              status="Not evaluated"
              title="Current pathway branch"
              tone="info"
            >
              No pathway branch has been evaluated. A source-reviewed pathway definition is required
              before this section can present a clinical state.
            </ResultSection>
            <ResultSection
              headingAs="h3"
              icon={ShieldAlert}
              status="Locked"
              title="Immediate actions"
              tone="warning"
            >
              No actions are generated by the UI framework preview.
            </ResultSection>
            <ResultSection
              headingAs="h3"
              icon={Activity}
              status="Pending pathway"
              title="Monitoring and review"
              tone="neutral"
            >
              A reviewed pathway must define the monitoring schedule and escalation criteria.
            </ResultSection>
          </div>
        </section>

        <footer className="text-muted flex items-start gap-2 text-xs leading-5">
          <ClipboardCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          This page contains no patient record, pathway engine execution or saved assessment state.
        </footer>
      </div>
    </AppShell>
  );
}
