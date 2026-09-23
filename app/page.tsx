import {
  ArrowRight,
  BookOpenCheck,
  Calculator,
  ClipboardPlus,
  FileCheck2,
  ShieldCheck,
} from "lucide-react";
import Image from "next/image";
import type { Route } from "next";
import Link from "next/link";

import { PathwayCard } from "@/components/home/pathway-card";
import { AppShell } from "@/components/layout/app-shell";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { loadClinicalSourceRegistry } from "@/src/clinical/sources/registry";
import type { ClinicalSource, SourceDate } from "@/src/clinical/sources/schema";

const primaryPathways = [
  {
    accent: "sodium" as const,
    direction: "low" as const,
    electrolyte: "Sodium",
    href: "/review/hyponatraemia/assessment",
    name: "Hyponatraemia",
    sourceId: "YSTHFT-HYPONATRAEMIA-EMERGENCY-V1",
    symbol: "Na+",
  },
  {
    accent: "potassium" as const,
    direction: "high" as const,
    electrolyte: "Potassium",
    href: "/review/hyperkalaemia/assessment",
    name: "Hyperkalaemia",
    sourceId: "YSTHFT-ACUTE-HYPERKALAEMIA-V1",
    symbol: "K+",
  },
  {
    accent: "calcium" as const,
    direction: "low" as const,
    electrolyte: "Calcium",
    href: "/review/hypocalcaemia/assessment",
    name: "Hypocalcaemia",
    sourceId: "YSTHFT-HYPOCALCAEMIA-V4",
    symbol: "Ca2+",
  },
] as const;

export default function Home() {
  const registry = loadClinicalSourceRegistry();
  const dkaSource = getSource(registry.sources, "JBDS-02-DKA-MARCH-2023");

  return (
    <AppShell>
      <div className="space-y-9">
        <section aria-labelledby="home-title" id="acute-electrolyte-management">
          <div className="border-info-border relative isolate min-h-48 overflow-hidden rounded-lg border shadow-xs">
            <Image
              alt=""
              className="motion-hero-image object-cover object-[72%_center]"
              data-testid="hero-visual"
              fill
              priority
              sizes="(min-width: 1024px) calc(100vw - 20rem), 100vw"
              src="/clinical-electrolyte-hero.webp"
            />
            <div className="absolute inset-0 bg-white/80 sm:bg-white/70 lg:bg-white/58" />
            <div className="relative z-10 flex min-h-48 max-w-3xl flex-col justify-center px-5 py-6 sm:px-7">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="info">Clinical workspace</Badge>
                <Badge variant="info">4 interactive workflows</Badge>
              </div>
              <h1 className="text-foreground mt-3 text-2xl font-bold sm:text-3xl" id="home-title">
                Acute electrolyte management
              </h1>
              <p className="text-muted-strong mt-2 max-w-2xl text-sm leading-6">
                Explore the connected electrolyte assessments and DKA calculator. Inputs remain in
                this browser session; no patient record is created.
              </p>
              <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                <Button asChild>
                  <Link href="/assessment/new">
                    <ClipboardPlus aria-hidden="true" />
                    New assessment
                  </Link>
                </Button>
                <Button asChild variant="secondary">
                  <Link href="/#source-governance">
                    Review source status
                    <ArrowRight aria-hidden="true" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          <div className="mt-7 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-primary text-xs font-bold uppercase">Primary pathways</p>
              <h2 className="text-foreground mt-1 text-xl font-bold">Choose a clinical pathway</h2>
            </div>
            <p className="text-muted max-w-xl text-sm leading-5 sm:text-right">
              Select a pathway to open its connected assessment.
            </p>
          </div>

          <div className="motion-home-grid mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {primaryPathways.map((pathway) => {
              const source = getSource(registry.sources, pathway.sourceId);

              return (
                <PathwayCard
                  accent={pathway.accent}
                  direction={pathway.direction}
                  electrolyte={pathway.electrolyte}
                  href={pathway.href}
                  key={pathway.name}
                  name={pathway.name}
                  organisation={source.organisation ?? "Organisation not recorded"}
                  reviewDate={formatSourceDate(source.reviewDate)}
                  sourceTitle={source.title}
                  symbol={pathway.symbol}
                  version={source.documentVersion ?? "Not recorded"}
                />
              );
            })}
          </div>
        </section>

        <section
          aria-labelledby="calculators-title"
          className="border-border border-y py-7"
          id="clinical-calculators"
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-primary text-xs font-bold uppercase">Source-mapped tools</p>
              <h2 className="text-foreground mt-1 text-xl font-bold" id="calculators-title">
                Clinical calculators &amp; pathways
              </h2>
            </div>
            <p className="text-muted max-w-xl text-sm leading-5 sm:text-right">
              Calculation logic is deterministic and source-traceable.
            </p>
          </div>

          <article className="motion-home-card motion-surface border-border bg-surface mt-5 grid gap-5 rounded-lg border p-5 shadow-xs lg:grid-cols-[auto_minmax(0,1fr)_16rem] lg:items-center">
            <span className="bg-danger-subtle text-danger-strong flex size-11 items-center justify-center rounded-md">
              <Calculator aria-hidden="true" className="size-5" strokeWidth={1.8} />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-foreground text-base font-bold">DKA management pathway</h3>
                <Badge variant="info">JBDS calculator</Badge>
              </div>
              <p className="text-muted mt-2 text-sm leading-6">
                The connected DKA calculator covers diagnosis through resolution and transition
                using current JBDS guidance. It is available for interactive technical testing.
              </p>
              <p className="text-muted-strong mt-2 text-xs">
                {dkaSource.organisation} | {dkaSource.documentVersion}
              </p>
            </div>
            <Button asChild className="w-full" variant="secondary">
              <Link href={"/review/dka/current-calculator" as Route} prefetch={false}>
                <Calculator aria-hidden="true" />
                Open DKA calculator
              </Link>
            </Button>
          </article>
        </section>

        <section aria-labelledby="governance-title" id="source-governance">
          <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-10">
            <div>
              <div className="bg-info-subtle text-primary flex size-10 items-center justify-center rounded-md">
                <BookOpenCheck aria-hidden="true" className="size-5" strokeWidth={1.8} />
              </div>
              <h2 className="text-foreground mt-4 text-lg font-bold" id="governance-title">
                Source guidelines and governance
              </h2>
              <p className="text-muted mt-2 max-w-3xl text-sm leading-6">
                Source documents, executable rules and test coverage are tracked separately.
              </p>
              <dl className="border-border mt-5 grid grid-cols-3 divide-x border-y py-4">
                <div className="pr-3">
                  <dt className="text-muted text-xs">Registered sources</dt>
                  <dd className="text-foreground mt-1 text-xl font-bold">
                    {registry.sources.length}
                  </dd>
                </div>
                <div className="px-3">
                  <dt className="text-muted text-xs">Interactive workflows</dt>
                  <dd className="text-foreground mt-1 text-xl font-bold">4</dd>
                </div>
                <div className="pl-3">
                  <dt className="text-muted text-xs">Stored patient records</dt>
                  <dd className="text-foreground mt-1 text-xl font-bold">0</dd>
                </div>
              </dl>
            </div>

            <div className="border-border border-l-2 pl-5">
              <div className="flex items-center gap-2">
                <FileCheck2 aria-hidden="true" className="text-success size-5" />
                <h3 className="text-foreground text-sm font-semibold">Technical status</h3>
              </div>
              <ol className="text-muted mt-4 space-y-3 text-sm leading-5">
                <li>1. Source files registered and integrity-checked</li>
                <li>2. Deterministic pathways and boundary tests</li>
                <li>3. Assessments remain in browser memory</li>
              </ol>
            </div>
          </div>
        </section>

        <section id="about-safety">
          <Alert title="No pathway is approved for clinical use" variant="warning">
            <div className="flex items-start gap-2">
              <ShieldCheck aria-hidden="true" className="mt-1 size-4 shrink-0" />
              <p>
                Follow approved local pathways, emergency procedures and current guidance. Do not
                enter patient-identifiable information while testing these workflows.
              </p>
            </div>
          </Alert>
        </section>
      </div>
    </AppShell>
  );
}

function getSource(
  sources: readonly Readonly<ClinicalSource>[],
  sourceId: string,
): Readonly<ClinicalSource> {
  const source = sources.find((candidate) => candidate.sourceId === sourceId);

  if (!source) {
    throw new Error(`Homepage source ${sourceId} is missing from the clinical source registry.`);
  }

  return source;
}

function formatSourceDate(sourceDate: SourceDate | null): string {
  if (!sourceDate) {
    return "Not recorded";
  }

  const [year, month = "01", day = "01"] = sourceDate.value.split("-");
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));

  if (sourceDate.precision === "year") {
    return year ?? sourceDate.value;
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: sourceDate.precision === "day" ? "numeric" : undefined,
    month: "short",
    timeZone: "UTC",
    year: "numeric",
  }).format(date);
}
