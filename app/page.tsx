import {
  ArrowRight,
  BookOpen,
  BrainCircuit,
  Check,
  ClipboardCheck,
  ExternalLink,
  FileCheck2,
  ShieldCheck,
  Stethoscope,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { AppShell } from "@/components/layout/app-shell";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const electrolytes = [
  {
    abnormalityHigh: "Hypernatraemia",
    abnormalityLow: "Hyponatraemia",
    badgeVariant: "info" as const,
    borderClass: "border-t-primary",
    coverage: "Source registered",
    iconClass: "bg-info-subtle text-primary",
    name: "Sodium",
    symbol: "Na+",
  },
  {
    abnormalityHigh: "Hyperkalaemia",
    abnormalityLow: "Hypokalaemia",
    badgeVariant: "success" as const,
    borderClass: "border-t-success",
    coverage: "Source registered",
    iconClass: "bg-success-subtle text-success-strong",
    name: "Potassium",
    symbol: "K+",
  },
  {
    abnormalityHigh: "Hypercalcaemia",
    abnormalityLow: "Hypocalcaemia",
    badgeVariant: "warning" as const,
    borderClass: "border-t-warning",
    coverage: "Source registered",
    iconClass: "bg-warning-subtle text-warning-strong",
    name: "Calcium",
    symbol: "Ca2+",
  },
  {
    abnormalityHigh: "Hypermagnesaemia",
    abnormalityLow: "Hypomagnesaemia",
    badgeVariant: "review" as const,
    borderClass: "border-t-review-strong",
    coverage: "Supporting source",
    iconClass: "bg-review-subtle text-review-strong",
    name: "Magnesium",
    symbol: "Mg2+",
  },
];

const workflowSteps = [
  {
    description: "Select a source-supported module after its pathway becomes available.",
    icon: Stethoscope,
    title: "Select the pathway",
  },
  {
    description: "Confirm only the structured inputs required by the reviewed source pathway.",
    icon: ClipboardCheck,
    title: "Confirm clinical context",
  },
  {
    description: "Review deterministic actions, limitations and page-level source references.",
    icon: FileCheck2,
    title: "Review the evidence",
  },
];

const coverageAreas = [
  "Hyponatraemia: primary pathway source registered; implementation pending",
  "Hyperkalaemia: primary pathway source registered; implementation pending",
  "Hypocalcaemia: primary pathway source registered; implementation pending",
  "Hypomagnesaemia: supporting source only; no standalone pathway is active",
];

export default function Home() {
  return (
    <AppShell>
      <div className="space-y-10 sm:space-y-12">
        <section
          aria-labelledby="home-title"
          className="border-info-border bg-surface relative isolate -mx-4 min-h-[19rem] overflow-hidden border-y shadow-xs sm:-mx-6 sm:min-h-[20rem] lg:-mx-8"
        >
          <Image
            alt=""
            className="object-cover object-[68%_center]"
            data-testid="hero-visual"
            fill
            priority
            sizes="(min-width: 1024px) calc(100vw - 16rem), 100vw"
            src="/clinical-electrolyte-hero.webp"
          />
          <div className="absolute inset-0 bg-white/70 sm:bg-white/55 lg:bg-white/35" />
          <div className="relative z-10 flex min-h-[19rem] items-center px-4 py-8 sm:min-h-[20rem] sm:px-6 lg:px-8">
            <div className="max-w-[39rem]">
              <Badge variant="review">Pathway migration in progress</Badge>
              <h1
                className="text-foreground mt-4 max-w-[36rem] text-3xl font-bold sm:text-4xl"
                id="home-title"
              >
                Evidence-based electrolyte support
              </h1>
              <p className="text-muted-strong mt-3 max-w-[37rem] text-sm leading-6 sm:text-base sm:leading-7">
                Supplied NHS and Trust documents are being converted into transparent,
                source-traceable pathways. No clinical pathway is active yet.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg">
                  <Link href="/assessment/new">
                    <FileCheck2 aria-hidden="true" />
                    View pathway status
                  </Link>
                </Button>
                <Button asChild size="lg" variant="secondary">
                  <Link href="/#workflow">
                    Review migration status
                    <ArrowRight aria-hidden="true" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section aria-labelledby="electrolytes-title" id="electrolytes">
          <div className="mb-5">
            <p className="text-primary text-xs font-bold uppercase">Registered scope</p>
            <h2 className="text-foreground mt-2 text-xl font-bold" id="electrolytes-title">
              Current source areas
            </h2>
            <p className="text-muted mt-2 max-w-2xl text-sm leading-6">
              Source registration does not mean that a pathway is implemented, reviewed or approved.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {electrolytes.map((electrolyte) => (
              <article
                className={`border-border bg-surface shadow-card rounded-lg border border-t-2 p-5 ${electrolyte.borderClass}`}
                key={electrolyte.name}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`flex size-11 shrink-0 items-center justify-center rounded-full text-xs font-bold ${electrolyte.iconClass}`}
                  >
                    {electrolyte.symbol}
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-foreground text-base font-semibold">{electrolyte.name}</h3>
                    <p className="text-muted mt-1 text-xs">Related abnormalities</p>
                  </div>
                </div>
                <ul className="text-muted-strong mt-5 space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <Check aria-hidden="true" className="text-success size-4 shrink-0" />
                    {electrolyte.abnormalityLow}
                  </li>
                  <li className="flex items-center gap-2">
                    <Check aria-hidden="true" className="text-success size-4 shrink-0" />
                    {electrolyte.abnormalityHigh}
                  </li>
                </ul>
                <div className="border-border mt-5 border-t pt-4">
                  <Badge variant={electrolyte.badgeVariant}>{electrolyte.coverage}</Badge>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section
          aria-labelledby="workflow-title"
          className="border-border border-y py-8"
          id="workflow"
        >
          <div className="grid gap-8 lg:grid-cols-[17rem_minmax(0,1fr)] lg:gap-12">
            <div>
              <p className="text-primary text-xs font-bold uppercase">Planned workflow</p>
              <h2 className="text-foreground mt-2 text-xl font-bold" id="workflow-title">
                From registered source to traceable result
              </h2>
              <p className="text-muted mt-3 text-sm leading-6">
                This workflow remains unavailable until pathway-specific implementation and review.
              </p>
            </div>
            <ol className="grid gap-6 md:grid-cols-3">
              {workflowSteps.map(({ description, icon: Icon, title }, index) => (
                <li className="relative" key={title}>
                  <div className="flex items-center gap-3">
                    <span className="bg-info-subtle text-primary flex size-10 shrink-0 items-center justify-center rounded-md">
                      <Icon aria-hidden="true" className="size-5" strokeWidth={1.8} />
                    </span>
                    <span className="text-muted text-xs font-bold">STEP {index + 1}</span>
                  </div>
                  <h3 className="text-foreground mt-4 text-sm font-semibold">{title}</h3>
                  <p className="text-muted mt-2 text-sm leading-6">{description}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section aria-labelledby="coverage-title" id="nice-coverage">
          <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_24rem] xl:gap-12">
            <div>
              <div className="bg-success-subtle text-success-strong flex size-11 items-center justify-center rounded-md">
                <ShieldCheck aria-hidden="true" className="size-5" strokeWidth={1.8} />
              </div>
              <p className="text-success-strong mt-4 text-xs font-bold uppercase">
                Migration status
              </p>
              <h2 className="text-foreground mt-2 text-xl font-bold" id="coverage-title">
                Source coverage is explicit, including the gaps
              </h2>
              <p className="text-muted mt-3 max-w-3xl text-sm leading-6">
                The retired catalogue is no longer a runtime authority. The new implementation
                starts from registered source documents and remains gated by clinical review.
              </p>

              <dl className="border-border mt-6 grid grid-cols-3 divide-x border-y py-4">
                <div className="pr-3">
                  <dt className="text-muted text-xs">Active pathways</dt>
                  <dd className="text-foreground mt-1 text-xl font-bold">0</dd>
                </div>
                <div className="px-3">
                  <dt className="text-muted text-xs">Source records</dt>
                  <dd className="text-foreground mt-1 text-xl font-bold">7</dd>
                </div>
                <div className="pl-3">
                  <dt className="text-muted text-xs">Target pathways</dt>
                  <dd className="text-foreground mt-1 text-xl font-bold">3</dd>
                </div>
              </dl>
            </div>

            <div className="border-border bg-surface rounded-lg border p-5">
              <h3 className="text-foreground text-sm font-semibold">Current source scope</h3>
              <ul className="text-muted mt-4 space-y-3 text-sm leading-5">
                {coverageAreas.map((area) => (
                  <li className="flex gap-2" key={area}>
                    <Check aria-hidden="true" className="text-success mt-0.5 size-4 shrink-0" />
                    <span>{area}</span>
                  </li>
                ))}
              </ul>
              <a
                className="text-primary hover:text-primary-hover mt-5 inline-flex min-h-10 items-center gap-2 text-sm font-semibold"
                href="https://www.nice.org.uk/guidance"
                rel="noreferrer"
                target="_blank"
              >
                Browse current NICE guidance
                <ExternalLink aria-hidden="true" className="size-4" />
              </a>
            </div>
          </div>
        </section>

        <section aria-label="Product safeguards" className="grid gap-4 md:grid-cols-3">
          <article className="border-border bg-surface shadow-card rounded-lg border p-5">
            <BookOpen aria-hidden="true" className="text-primary size-6" strokeWidth={1.8} />
            <h2 className="text-foreground mt-4 text-base font-semibold">Evidence traceability</h2>
            <p className="text-muted mt-2 text-sm leading-6">
              Future outputs must identify the pathway version, source document, page, section and
              clinical-review status.
            </p>
            <Link
              className="text-primary hover:text-primary-hover mt-4 inline-flex min-h-10 items-center gap-2 text-sm font-semibold"
              href="/#nice-coverage"
            >
              View evidence coverage
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </article>

          <article className="border-border bg-surface shadow-card rounded-lg border p-5">
            <BrainCircuit
              aria-hidden="true"
              className="text-review-strong size-6"
              strokeWidth={1.8}
            />
            <div className="mt-4 flex items-center gap-2">
              <h2 className="text-foreground text-base font-semibold">Optional browser AI</h2>
              <Badge variant="review">Deferred</Badge>
            </div>
            <p className="text-muted mt-2 text-sm leading-6">
              Note extraction is outside the current implementation phase and cannot influence a
              pathway branch or management result.
            </p>
          </article>

          <article className="border-border bg-surface shadow-card rounded-lg border p-5">
            <ShieldCheck aria-hidden="true" className="text-success size-6" strokeWidth={1.8} />
            <h2 className="text-foreground mt-4 text-base font-semibold">Fail-closed migration</h2>
            <p className="text-muted mt-2 text-sm leading-6">
              With no reviewed pathway active, the application accepts no clinical inputs and
              generates no treatment instruction.
            </p>
          </article>
        </section>

        <Alert id="safety-notice" title="Clinical pathways are not active" variant="warning">
          <p>
            Do not use this application for diagnosis or management decisions. Follow approved local
            pathways, emergency procedures and current guidance. Do not enter real
            patient-identifiable information.
          </p>
        </Alert>
      </div>
    </AppShell>
  );
}
