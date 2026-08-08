import {
  ArrowRight,
  BookOpen,
  BrainCircuit,
  Check,
  ClipboardCheck,
  ExternalLink,
  FileCheck2,
  Plus,
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
    coverage: "3 draft rules",
    iconClass: "bg-info-subtle text-primary",
    name: "Sodium",
    symbol: "Na+",
  },
  {
    abnormalityHigh: "Hyperkalaemia",
    abnormalityLow: "Hypokalaemia",
    badgeVariant: "success" as const,
    borderClass: "border-t-success",
    coverage: "8 draft rules",
    iconClass: "bg-success-subtle text-success-strong",
    name: "Potassium",
    symbol: "K+",
  },
  {
    abnormalityHigh: "Hypercalcaemia",
    abnormalityLow: "Hypocalcaemia",
    badgeVariant: "warning" as const,
    borderClass: "border-t-warning",
    coverage: "2 draft rules",
    iconClass: "bg-warning-subtle text-warning-strong",
    name: "Calcium",
    symbol: "Ca2+",
  },
  {
    abnormalityHigh: "Hypermagnesaemia",
    abnormalityLow: "Hypomagnesaemia",
    badgeVariant: "review" as const,
    borderClass: "border-t-review-strong",
    coverage: "NICE gap",
    iconClass: "bg-review-subtle text-review-strong",
    name: "Magnesium",
    symbol: "Mg2+",
  },
];

const workflowSteps = [
  {
    description: "Choose an electrolyte and the structured pathway that matches the abnormality.",
    icon: Stethoscope,
    title: "Select the pathway",
  },
  {
    description: "Enter the result, trend, medicines, renal function, fluid status, and context.",
    icon: ClipboardCheck,
    title: "Confirm clinical context",
  },
  {
    description:
      "Review a deterministic output with its matched rule, limitations, and NICE source.",
    icon: FileCheck2,
    title: "Review the evidence",
  },
];

const coverageAreas = [
  "Sodium: IV-fluid incidents and an adrenal-insufficiency context",
  "Potassium: IV fluids, CKD monitoring, medicine eligibility, and AKI escalation",
  "Adjusted calcium: primary-hyperparathyroidism assessment and referral",
  "Magnesium: no condition-specific NICE management rule in the current catalogue",
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
              <Badge variant="info">Adult clinical decision support</Badge>
              <h1
                className="text-foreground mt-4 max-w-[36rem] text-3xl font-bold sm:text-4xl"
                id="home-title"
              >
                Evidence-based electrolyte support
              </h1>
              <p className="text-muted-strong mt-3 max-w-[37rem] text-sm leading-6 sm:text-base sm:leading-7">
                Structure an adult electrolyte assessment and review transparent, deterministic
                outputs linked to the project&apos;s NICE-only evidence catalogue.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg">
                  <Link href="/assessment/new">
                    <Plus aria-hidden="true" />
                    Start new assessment
                  </Link>
                </Button>
                <Button asChild size="lg" variant="secondary">
                  <Link href="/#workflow">
                    How it works
                    <ArrowRight aria-hidden="true" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section aria-labelledby="electrolytes-title" id="electrolytes">
          <div className="mb-5">
            <p className="text-primary text-xs font-bold uppercase">New assessment</p>
            <h2 className="text-foreground mt-2 text-xl font-bold" id="electrolytes-title">
              Choose an electrolyte category
            </h2>
            <p className="text-muted mt-2 max-w-2xl text-sm leading-6">
              Review the supported abnormalities and current NICE catalogue coverage before entering
              clinical information.
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
              <p className="text-primary text-xs font-bold uppercase">Structured workflow</p>
              <h2 className="text-foreground mt-2 text-xl font-bold" id="workflow-title">
                From result to traceable review
              </h2>
              <p className="text-muted mt-3 text-sm leading-6">
                Every required field must be confirmed before rule evaluation begins.
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
              <p className="text-success-strong mt-4 text-xs font-bold uppercase">NICE coverage</p>
              <h2 className="text-foreground mt-2 text-xl font-bold" id="coverage-title">
                Coverage is explicit, including the gaps
              </h2>
              <p className="text-muted mt-3 max-w-3xl text-sm leading-6">
                The draft catalogue contains context-specific NICE rules rather than pretending to
                be a complete treatment handbook. Unsupported scenarios must route to current local
                policy or specialist review.
              </p>

              <dl className="border-border mt-6 grid grid-cols-3 divide-x border-y py-4">
                <div className="pr-3">
                  <dt className="text-muted text-xs">Draft rules</dt>
                  <dd className="text-foreground mt-1 text-xl font-bold">17</dd>
                </div>
                <div className="px-3">
                  <dt className="text-muted text-xs">Source records</dt>
                  <dd className="text-foreground mt-1 text-xl font-bold">8</dd>
                </div>
                <div className="pl-3">
                  <dt className="text-muted text-xs">Covered categories</dt>
                  <dd className="text-foreground mt-1 text-xl font-bold">3 of 4</dd>
                </div>
              </dl>
            </div>

            <div className="border-border bg-surface rounded-lg border p-5">
              <h3 className="text-foreground text-sm font-semibold">Current catalogue scope</h3>
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
              Supported outputs identify the matched rule, NICE source, relevant section, and known
              limitation.
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
              <Badge variant="review">Off by default</Badge>
            </div>
            <p className="text-muted mt-2 text-sm leading-6">
              Browser-based extraction may help structure notes later. It never replaces the form,
              and every extracted field must be reviewed and confirmed.
            </p>
          </article>

          <article className="border-border bg-surface shadow-card rounded-lg border p-5">
            <ShieldCheck aria-hidden="true" className="text-success size-6" strokeWidth={1.8} />
            <h2 className="text-foreground mt-4 text-base font-semibold">Safety-first output</h2>
            <p className="text-muted mt-2 text-sm leading-6">
              No rule match means no invented treatment instruction. The application surfaces the
              limitation and directs the clinician to an approved pathway.
            </p>
          </article>
        </section>

        <Alert
          id="safety-notice"
          title="Educational prototype - clinical review required"
          variant="warning"
        >
          <p>
            Catalogue rules are pending clinician validation and are not a substitute for
            professional judgement, emergency pathways, local policy, or current NICE guidance. Do
            not enter real patient-identifiable information.
          </p>
        </Alert>
      </div>
    </AppShell>
  );
}
