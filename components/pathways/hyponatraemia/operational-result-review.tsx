import {
  Activity,
  ArrowUpRight,
  ClipboardCheck,
  Gauge,
  HeartPulse,
  ListChecks,
  Stethoscope,
} from "lucide-react";

import {
  MonitoringTimeline,
  ResultSection,
  ReviewStatusBadge,
  SafetyAlert,
} from "@/components/clinical";
import { Badge } from "@/components/ui/badge";
import {
  evaluateHyponatraemiaOperationalResult,
  type HyponatraemiaOperationalResult,
} from "@/src/clinical/pathways/hyponatraemia";

export const representativeHyponatraemiaOperationalResult = evaluateHyponatraemiaOperationalResult({
  cerebralOedemaSigns: ["confusion"],
  fluidStatus: "euvolaemic",
  odsRiskStatus: "high-risk-confirmed",
  serumOsmolality: 270,
  sodium: 124,
  symptomResponse: "improved",
  urineOsmolality: 120,
  urineResultsAvailable: true,
  urineSodium: 40.1,
});

export function HyponatraemiaOperationalResultReview({
  contextLabel = "Representative emergency result",
  explanationDescription = "Deterministic explanation from the confirmed example inputs",
  result = representativeHyponatraemiaOperationalResult,
}: {
  contextLabel?: string;
  explanationDescription?: string;
  result?: HyponatraemiaOperationalResult;
}) {
  return (
    <article className="border-border bg-surface border-y">
      <header className="border-border border-b p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-danger text-xs font-bold uppercase">{contextLabel}</p>
            <h2 className="text-foreground mt-1 text-xl font-bold">
              {result.severity?.label ?? "Hyponatraemia assessment"}
            </h2>
            <p className="text-muted mt-1 text-sm leading-6">
              {result.severity
                ? `Sodium ${result.severity.value} ${result.severity.unit}`
                : "No severity classification selected"}
              {result.fluidStatusLabel ? ` | ${result.fluidStatusLabel}` : ""}
              {result.confirmedSignLabels.length > 0
                ? ` | ${result.confirmedSignLabels.join(", ")} confirmed`
                : ""}
            </p>
          </div>
          <ReviewStatusBadge status={result.clinicalReviewStatus} />
        </div>
      </header>

      <div className="p-5 sm:p-6">
        <Overview result={result} />

        {result.immediateActions.length > 0 || result.treatmentTarget ? (
          <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.65fr)]">
            <ActionList actions={result.immediateActions} title="Immediate actions" />
            {result.treatmentTarget ? (
              <ResultSection
                description="Initial correction goal"
                dividers={false}
                icon={Gauge}
                status="First 2-4 hours"
                title="Correction target"
                tone="info"
              >
                {result.treatmentTarget}
              </ResultSection>
            ) : null}
          </div>
        ) : null}

        <section aria-labelledby="safety-heading" className="mt-8">
          <h2 className="text-foreground text-base font-semibold" id="safety-heading">
            Safety
          </h2>
          <div className="mt-4 space-y-3">
            {result.warnings.map((warning) => (
              <SafetyAlert
                key={warning.warningId}
                level={warning.severity === "critical" ? "critical" : "warning"}
                title={warningTitle(warning.warningId)}
              >
                {warning.message}
              </SafetyAlert>
            ))}
          </div>
        </section>

        <div className="border-border mt-8 border-t pt-8">
          {result.monitoring.length > 0 ? (
            <MonitoringTimeline
              dividers={false}
              items={result.monitoring.map((item, index) => ({
                description: item.instruction,
                id: item.monitoringId,
                label: index === 0 ? "Initial sodium checks" : "Ongoing sodium checks",
                status: index === 0 ? "current" : "upcoming",
                timing: index === 0 ? "Hourly until the target increase" : "Then every 4-6 hours",
              }))}
              title="Monitoring"
            />
          ) : (
            <ResultSection dividers={false} icon={Activity} title="Monitoring" tone="warning">
              No monitoring schedule has been selected by this result.
            </ResultSection>
          )}
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          <section>
            <ActionList actions={result.nextActions} title="Next steps" />
            <div className="mt-5">
              <ResultSection dividers={false} icon={ArrowUpRight} title="Escalation" tone="warning">
                {result.escalationSummary}
              </ResultSection>
            </div>
          </section>
          <CauseResult result={result} />
        </div>

        <div className="border-border mt-8 grid gap-8 border-t pt-8 lg:grid-cols-2">
          <section aria-labelledby="why-selected-heading">
            <div className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className="bg-info-subtle text-primary flex size-10 shrink-0 items-center justify-center rounded-md"
              >
                <ListChecks className="size-5" strokeWidth={1.8} />
              </span>
              <div>
                <h2 className="text-foreground text-base font-semibold" id="why-selected-heading">
                  Why this result was selected
                </h2>
                <p className="text-muted mt-1 text-xs leading-5">{explanationDescription}</p>
              </div>
            </div>
            <ol className="border-border mt-4 divide-y">
              {result.whySelected.map((reason, index) => (
                <li
                  className="grid grid-cols-[1.75rem_minmax(0,1fr)] gap-3 py-3 text-sm leading-6"
                  key={reason}
                >
                  <span className="bg-surface-subtle text-muted-strong flex size-7 items-center justify-center rounded-full text-xs font-bold">
                    {index + 1}
                  </span>
                  <span className="text-muted-strong">{reason}</span>
                </li>
              ))}
            </ol>
          </section>

          <ResultSection
            description="Governance gate"
            dividers={false}
            icon={ClipboardCheck}
            status="Locked"
            title="Clinical review status"
            tone="warning"
          >
            This result remains a technical preview awaiting clinical review. It is not approved for
            patient care or project use.
          </ResultSection>
        </div>
      </div>
    </article>
  );
}

function Overview({ result }: { result: HyponatraemiaOperationalResult }) {
  const items = [
    {
      label: "Severity",
      value: result.severity?.label ?? "Not classified",
    },
    { label: "Current branch", value: result.currentBranch.label },
    { label: "Fluid status", value: result.fluidStatusLabel ?? "Not established" },
    { label: "Result status", value: statusLabel(result.status) },
  ];

  return (
    <dl
      aria-label="Operational result summary"
      className="border-border grid border-y lg:grid-cols-4 lg:divide-x"
    >
      {items.map((item, index) => (
        <div
          className={`min-w-0 py-4 lg:px-4 ${index > 0 ? "border-border border-t lg:border-t-0" : ""} lg:first:pl-0 lg:last:pr-0`}
          key={item.label}
        >
          <dt className="text-muted text-xs font-medium">{item.label}</dt>
          <dd className="text-foreground mt-1 text-sm leading-5 font-semibold">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function ActionList({
  actions,
  title,
}: {
  actions: HyponatraemiaOperationalResult["immediateActions"];
  title: string;
}) {
  return (
    <section>
      <h2 className="text-foreground text-base font-semibold">{title}</h2>
      {actions.length > 0 ? (
        <ol className="border-border mt-4 divide-y">
          {actions.map((action, index) => (
            <li className="grid grid-cols-[2rem_minmax(0,1fr)] gap-3 py-4" key={action.actionId}>
              <span className="bg-info-subtle text-primary flex size-8 items-center justify-center rounded-full text-xs font-bold">
                {index + 1}
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-foreground text-sm font-semibold">
                    {actionLabel(action.actionId)}
                  </h3>
                  <Badge variant={action.timing === "immediate" ? "danger" : "info"}>
                    {action.timing}
                  </Badge>
                </div>
                <p className="text-muted mt-1 text-sm leading-6">{action.instruction}</p>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-muted mt-4 py-2 text-sm leading-6">
          No action has been selected for this section.
        </p>
      )}
    </section>
  );
}

function CauseResult({ result }: { result: HyponatraemiaOperationalResult }) {
  return (
    <section>
      <h2 className="text-foreground text-base font-semibold">Cause assessment</h2>
      {result.euvolaemicUnderlyingCauseLabel ? (
        <div className="mt-4">
          <ResultSection
            description="Explicit clinician selection - not inferred from laboratory values"
            dividers={false}
            icon={Stethoscope}
            title={result.euvolaemicUnderlyingCauseLabel}
            tone="info"
          >
            This cause state was explicitly confirmed for management-pathway selection.
          </ResultSection>
        </div>
      ) : null}
      {result.causePattern ? (
        <div className={result.euvolaemicUnderlyingCauseLabel ? "mt-5" : "mt-4"}>
          <ResultSection
            description="Compatible category only - not a definitive diagnosis"
            dividers={false}
            icon={HeartPulse}
            title={result.causePattern.label}
            tone="info"
            {...(result.serumTonicity
              ? { status: `${capitalise(result.serumTonicity)} pattern` }
              : {})}
          >
            <p>{result.causePattern.summary}</p>
            <ul className="border-border mt-3 divide-y">
              {result.causePattern.causes.map((cause) => (
                <li className="flex min-h-10 items-center gap-2 py-2" key={cause}>
                  <Stethoscope aria-hidden="true" className="text-primary size-4 shrink-0" />
                  {cause}
                </li>
              ))}
            </ul>
          </ResultSection>
          {result.causePattern.id === "siadh-compatible" ? (
            <div className="mt-4">
              <SafetyAlert level="warning" title="No dedicated SIADH management output">
                The compatible pattern is shown for review, but this result does not generate SIADH
                treatment instructions.
              </SafetyAlert>
            </div>
          ) : null}
        </div>
      ) : !result.euvolaemicUnderlyingCauseLabel ? (
        <p className="text-muted mt-4 py-2 text-sm leading-6">
          No compatible cause category has been selected.
        </p>
      ) : null}
    </section>
  );
}

function actionLabel(actionId: string): string {
  switch (actionId) {
    case "obtain-pre-treatment-investigations":
      return "Pre-treatment investigations";
    case "administer-initial-hypertonic-saline":
      return "Initial hypertonic saline";
    case "repeat-hypertonic-saline-dose":
      return "Repeat treatment";
    case "diagnose-manage-cause-consultant-review":
      return "Cause management";
    case "review-hypovolaemic-causes":
      return "Review hypovolaemic causes";
    case "use-hypovolaemic-isotonic-saline":
    case "add-hypovolaemic-isotonic-saline":
      return "0.9% sodium chloride";
    case "use-separate-siadh-pathway":
      return "Separate SIADH pathway";
    case "fluid-restriction-water-intoxication":
      return "Fluid restriction";
    case "refer-senior-hypervolaemic-cause":
      return "Senior review and cause management";
    default:
      return "Pathway action";
  }
}

function warningTitle(warningId: string): string {
  switch (warningId) {
    case "avoid-excessive-correction":
      return "Maximum correction limit";
    case "siadh-source-not-supplied":
      return "Dedicated SIADH pathway not supplied";
    default:
      return "Required exclusion checks";
  }
}

function statusLabel(status: HyponatraemiaOperationalResult["status"]): string {
  switch (status) {
    case "awaiting-input":
      return "Awaiting input";
    case "blocked":
      return "Blocked safely";
    case "requires-clinical-review":
      return "Clinical review required";
    case "unsupported":
      return "Unsupported";
  }
}

function capitalise(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
