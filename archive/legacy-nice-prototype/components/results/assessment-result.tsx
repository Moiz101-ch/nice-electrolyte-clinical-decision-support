"use client";

import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  CircleAlert,
  ClipboardList,
  ExternalLink,
  FileWarning,
  Info,
  LockKeyhole,
  Plus,
  ShieldAlert,
  ShieldCheck,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode, RefObject } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  formatAnswer,
  formatClinicalContext,
  formatCondition,
  formatElectrolyte,
  getVisibleContextQuestions,
  pregnancyStatusOptions,
  type AssessmentFormState,
} from "@/src/assessment/structured-assessment";
import type { BlockedRuleEvaluation, RuleEngineOutcome, RuleResult } from "@/src/rule-engine/types";

interface AssessmentResultProps {
  assessment: AssessmentFormState;
  onEdit: () => void;
  onStartNew: () => void;
  outcome: RuleEngineOutcome;
  resultRef: RefObject<HTMLElement | null>;
}

type ResultTone = "danger" | "info" | "success" | "warning";

const toneStyles: Record<ResultTone, string> = {
  danger: "border-danger-border bg-danger-subtle text-danger-strong",
  info: "border-info-border bg-info-subtle text-info-strong",
  success: "border-success-border bg-success-subtle text-success-strong",
  warning: "border-warning-border bg-warning-subtle text-warning-strong",
};

const toneIcons: Record<ResultTone, LucideIcon> = {
  danger: TriangleAlert,
  info: Info,
  success: ShieldCheck,
  warning: CircleAlert,
};

export function AssessmentResult({
  assessment,
  onEdit,
  onStartNew,
  outcome,
  resultRef,
}: AssessmentResultProps) {
  const contextQuestions = getVisibleContextQuestions(assessment);
  const heading = getResultHeading(outcome);

  return (
    <section
      aria-labelledby="assessment-result-title"
      className="space-y-6 focus:outline-none"
      ref={resultRef}
      tabIndex={-1}
    >
      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-primary text-xs font-bold uppercase">Assessment result</p>
            <Badge variant="neutral">
              <LockKeyhole aria-hidden="true" className="size-3.5" />
              Locked to confirmed data
            </Badge>
          </div>
          <h1
            className="text-foreground mt-3 text-2xl font-bold sm:text-[1.75rem]"
            id="assessment-result-title"
          >
            {heading}
          </h1>
          <p className="text-muted mt-2 text-sm leading-6">
            Deterministic catalogue output generated only from the structured information you
            reviewed and confirmed.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button onClick={onEdit} type="button" variant="secondary">
            <ArrowLeft aria-hidden="true" />
            Edit assessment
          </Button>
          <Button onClick={onStartNew} type="button">
            <Plus aria-hidden="true" />
            New assessment
          </Button>
        </div>
      </header>

      <PriorityBanner outcome={outcome} />

      <ResultPanel
        description="The exact structured fields used for this deterministic evaluation."
        icon={ClipboardList}
        id="information-used"
        title="Information used"
      >
        <dl className="grid sm:grid-cols-2 xl:grid-cols-3">
          <SummaryFact label="Age" value={`${assessment.ageYears} years`} />
          <SummaryFact label="Electrolyte" value={formatElectrolyte(assessment.electrolyte)} />
          <SummaryFact label="Assessment" value={formatCondition(assessment.condition)} />
          <SummaryFact label="Latest result" value={`${assessment.measuredValue} mmol/L`} />
          <SummaryFact
            label="Clinical context"
            value={formatClinicalContext(assessment.clinicalContext)}
          />
          <SummaryFact
            label="Pregnancy status"
            value={formatPregnancyStatus(assessment.pregnancyStatus)}
          />
        </dl>

        {contextQuestions.length > 0 ? (
          <div className="border-border mt-5 border-t pt-5">
            <h3 className="text-foreground text-sm font-semibold">Context-specific evidence</h3>
            <dl className="mt-3 divide-y divide-[var(--color-border)]">
              {contextQuestions.map((question) => (
                <div
                  className="grid gap-1 py-3 sm:grid-cols-[minmax(0,1fr)_minmax(12rem,1fr)] sm:gap-6"
                  key={question.id}
                >
                  <dt className="text-muted text-sm">{question.label}</dt>
                  <dd className="text-foreground text-sm font-semibold break-words">
                    {formatAnswer(question, assessment)}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        ) : (
          <p className="text-muted border-border mt-5 border-t pt-5 text-sm">
            No additional context-specific fields were required.
          </p>
        )}
      </ResultPanel>

      <NiceResultSection outcome={outcome} />
      <ExplanationSection outcome={outcome} />
      <MissingInformationSection outcome={outcome} />
      <LimitationsSection outcome={outcome} />
      <SourceSection outcome={outcome} />

      <div className="border-border flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-muted max-w-2xl text-xs leading-5">
          This result does not replace professional clinical judgement and must not be used as the
          sole basis for emergency treatment.
        </p>
        <Button onClick={onEdit} type="button" variant="secondary">
          <ArrowLeft aria-hidden="true" />
          Edit assessment
        </Button>
      </div>
    </section>
  );
}

function PriorityBanner({ outcome }: { outcome: RuleEngineOutcome }) {
  const presentation = getPriorityPresentation(outcome);
  const Icon = toneIcons[presentation.tone];

  return (
    <section
      aria-label="Result priority"
      className={cn(
        "grid gap-4 rounded-lg border p-5 shadow-xs sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center sm:p-6",
        toneStyles[presentation.tone],
      )}
    >
      <span className="flex size-10 items-center justify-center rounded-full bg-white/70">
        <Icon aria-hidden="true" className="size-5" strokeWidth={2} />
      </span>
      <div>
        <p className="text-xs font-bold uppercase">Priority</p>
        <h2 className="text-foreground mt-1 text-lg font-semibold">{presentation.title}</h2>
        <p className="mt-1 text-sm leading-6">{presentation.description}</p>
      </div>
      <Badge className="w-fit" variant={presentation.tone}>
        {presentation.badge}
      </Badge>
    </section>
  );
}

function NiceResultSection({ outcome }: { outcome: RuleEngineOutcome }) {
  if (outcome.status === "blocked") {
    return (
      <ResultPanel
        description="The engine stopped before selecting a NICE management rule."
        icon={ShieldAlert}
        id="nice-result"
        title="NICE-derived result"
      >
        <div className="border-warning-border bg-warning-subtle rounded-md border p-4 sm:p-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="warning">Blocked safely</Badge>
            <Badge variant="neutral">No rule selected</Badge>
          </div>
          <h3 className="text-foreground mt-4 text-lg font-semibold">
            No management output was generated
          </h3>
          <p className="text-warning-strong mt-2 text-sm leading-6">
            Required scope, validation, or confirmation checks were not satisfied. The engine did
            not generate treatment instructions.
          </p>
        </div>
      </ResultPanel>
    );
  }

  const unsupported = outcome.status === "unsupported";

  return (
    <ResultPanel
      description={
        unsupported
          ? "A safety result returned because no applicable NICE-only pathway matched."
          : "The locked management output returned by the deterministic NICE catalogue."
      }
      icon={unsupported ? FileWarning : ShieldCheck}
      id="nice-result"
      title="NICE-derived result"
    >
      <div
        className={cn(
          "rounded-md border p-4 sm:p-5",
          unsupported
            ? "border-warning-border bg-warning-subtle"
            : "border-success-border bg-success-subtle",
        )}
      >
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={unsupported ? "warning" : "success"}>
            {unsupported ? "Unsupported NICE-only scenario" : "Deterministic match"}
          </Badge>
          <Badge variant="neutral">
            <LockKeyhole aria-hidden="true" className="size-3.5" />
            Locked output
          </Badge>
        </div>
        <p className="text-muted-strong mt-4 text-xs font-bold uppercase">{outcome.outputStatus}</p>
        <h3 className="text-foreground mt-2 text-lg font-semibold">
          {unsupported ? "No treatment instructions generated" : "Catalogue management output"}
        </h3>
        <p className="text-foreground mt-2 text-sm leading-6">{outcome.managementOutput}</p>
      </div>

      <dl className="mt-5 grid sm:grid-cols-2 xl:grid-cols-4">
        <SummaryFact label="Triggered rule" value={outcome.ruleId} />
        <SummaryFact label="Catalogue version" value={outcome.catalogueVersion} />
        <SummaryFact label="Clinical review" value={outcome.clinicalReviewStatus} />
        <SummaryFact label="Output status" value={outcome.status} />
      </dl>
    </ResultPanel>
  );
}

function ExplanationSection({ outcome }: { outcome: RuleEngineOutcome }) {
  const { trace } = outcome;

  return (
    <ResultPanel
      description={
        outcome.status === "blocked"
          ? "Why deterministic evaluation stopped without returning guidance."
          : "The confirmed facts and ordered evaluators behind this result."
      }
      icon={CheckCircle2}
      id="match-explanation"
      title={
        outcome.status === "blocked"
          ? "Why evaluation stopped"
          : outcome.status === "unsupported"
            ? "Why this result was returned"
            : "Why this rule matched"
      }
    >
      {outcome.status === "blocked" ? (
        <p className="text-foreground text-sm leading-6">
          Evaluation stopped because {formatBlockedReason(outcome.reason).toLowerCase()} checks were
          not satisfied. No fallback treatment rule was inferred.
        </p>
      ) : (
        <>
          <p className="text-foreground text-sm leading-6">{formatExplanationSummary(outcome)}</p>
          <dl className="mt-4 divide-y divide-[var(--color-border)] border-y border-[var(--color-border)]">
            {outcome.explanation.facts.map((fact) => (
              <div
                className="grid gap-1 py-3 sm:grid-cols-[minmax(0,1fr)_minmax(12rem,1fr)] sm:gap-6"
                key={`${fact.field}-${fact.label}`}
              >
                <dt className="text-muted text-sm">{fact.label}</dt>
                <dd className="text-foreground text-sm font-semibold break-words">
                  {formatFactValue(fact.value)}
                </dd>
              </div>
            ))}
          </dl>
        </>
      )}

      {trace !== null ? (
        <details className="border-border mt-5 border-t pt-4">
          <summary className="text-foreground cursor-pointer text-sm font-semibold">
            Deterministic evaluation trace
          </summary>
          <ol className="mt-3 space-y-2">
            {trace.entries.length === 0 ? (
              <li className="text-muted text-sm">No rule evaluators ran before the safety stop.</li>
            ) : (
              trace.entries.map((entry, index) => (
                <li
                  className="flex flex-wrap items-center gap-2 text-sm"
                  key={`${entry.evaluatorId}-${index}`}
                >
                  <span className="text-muted tabular-nums">{index + 1}.</span>
                  <code className="text-foreground break-all">{entry.evaluatorId}</code>
                  <Badge variant={entry.decision === "match" ? "success" : "neutral"}>
                    {entry.decision}
                  </Badge>
                </li>
              ))
            )}
          </ol>
        </details>
      ) : null}
    </ResultPanel>
  );
}

function MissingInformationSection({ outcome }: { outcome: RuleEngineOutcome }) {
  return (
    <ResultPanel
      description="Fields that prevented or constrained deterministic evaluation."
      icon={CircleAlert}
      id="missing-information"
      title="Missing information"
    >
      {outcome.status === "blocked" ? (
        <ul className="space-y-3">
          {outcome.issues.map((issue) => (
            <li
              className="border-warning-border bg-warning-subtle grid gap-1 rounded-md border px-4 py-3 sm:grid-cols-[minmax(10rem,0.4fr)_minmax(0,1fr)] sm:gap-5"
              key={`${issue.field}-${issue.message}`}
            >
              <code className="text-warning-strong text-xs font-semibold break-all">
                {issue.field}
              </code>
              <span className="text-foreground text-sm leading-6">{issue.message}</span>
            </li>
          ))}
        </ul>
      ) : (
        <div className="text-success-strong flex items-start gap-3 text-sm leading-6">
          <CheckCircle2 aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
          <p>
            No missing confirmed fields blocked this evaluation.
            {outcome.status === "unsupported"
              ? " The result is limited by NICE catalogue coverage, not by an invented answer."
              : " The result used only the facts shown above."}
          </p>
        </div>
      )}
    </ResultPanel>
  );
}

function LimitationsSection({ outcome }: { outcome: RuleEngineOutcome }) {
  const limitation =
    outcome.status === "blocked"
      ? "The engine stopped before selecting a NICE rule. No treatment recommendation was generated."
      : outcome.limitations;

  return (
    <ResultPanel
      description="Boundaries that must remain visible when this output is interpreted."
      icon={TriangleAlert}
      id="limitations"
      title="Limitations and safety"
    >
      <div className="border-warning-border bg-warning-subtle rounded-md border p-4">
        <p className="text-warning-strong text-sm leading-6 font-semibold">{limitation}</p>
      </div>
      <ul className="text-muted mt-4 space-y-2 text-sm leading-6">
        <li>Verify this output against current NICE guidance and applicable local policy.</li>
        <li>Do not use this prototype as the sole basis for emergency treatment.</li>
        <li>All active clinical rules remain subject to qualified clinical review.</li>
      </ul>
    </ResultPanel>
  );
}

function SourceSection({ outcome }: { outcome: RuleEngineOutcome }) {
  if (outcome.status === "blocked" || outcome.sources.length === 0) {
    return (
      <section aria-labelledby="nice-source-title">
        <div className="flex items-start gap-3">
          <BookOpen aria-hidden="true" className="text-primary mt-0.5 size-5 shrink-0" />
          <div>
            <h2 className="text-foreground text-base font-semibold" id="nice-source-title">
              Exact NICE source
            </h2>
            <p className="text-muted mt-1 text-sm leading-6">
              Source traceability is shown only when a supported NICE rule is selected.
            </p>
          </div>
        </div>
        <div className="border-warning-border bg-warning-subtle mt-4 rounded-lg border p-5">
          <p className="text-foreground font-semibold">No treatment source attached</p>
          <p className="text-warning-strong mt-2 text-sm leading-6">
            {outcome.status === "unsupported"
              ? "No definitive NICE-only pathway matched. Use an approved local protocol or seek specialist review."
              : "The assessment was blocked before a rule and NICE source could be selected."}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section aria-labelledby="nice-source-title">
      <div className="flex items-start gap-3">
        <BookOpen aria-hidden="true" className="text-primary mt-0.5 size-5 shrink-0" />
        <div>
          <h2 className="text-foreground text-base font-semibold" id="nice-source-title">
            Exact NICE source
          </h2>
          <p className="text-muted mt-1 text-sm leading-6">
            Official guidance and recommendation sections attached by the rule catalogue.
          </p>
        </div>
      </div>
      <div
        className={cn(
          "mt-4 grid gap-4",
          outcome.sources.length > 1 ? "lg:grid-cols-2" : "grid-cols-1",
        )}
      >
        {outcome.sources.map((source) => (
          <article
            className="border-border bg-surface rounded-lg border p-5 shadow-xs"
            key={source.sourceId}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Badge variant="info">NICE {source.guidanceCode}</Badge>
              <span className="text-muted text-xs">Checked {source.checkedOn}</span>
            </div>
            <h3 className="text-foreground mt-4 font-semibold">{source.title}</h3>
            <dl className="mt-4 space-y-3">
              <SourceFact label="Source ID" value={source.sourceId} />
              <SourceFact
                label="Recommendation section"
                value={source.recommendationSections.join(", ")}
              />
            </dl>
            <Button asChild className="mt-5 w-full sm:w-auto" variant="secondary">
              <a href={source.url} rel="noreferrer noopener" target="_blank">
                Open NICE guidance
                <ExternalLink aria-hidden="true" />
              </a>
            </Button>
          </article>
        ))}
      </div>
    </section>
  );
}

function ResultPanel({
  children,
  description,
  icon: Icon,
  id,
  title,
}: {
  children: ReactNode;
  description: string;
  icon: LucideIcon;
  id: string;
  title: string;
}) {
  const headingId = `${id}-title`;

  return (
    <section
      aria-labelledby={headingId}
      className="border-border bg-surface rounded-lg border shadow-xs"
    >
      <div className="border-border flex items-start gap-3 border-b px-5 py-4 sm:px-6">
        <Icon
          aria-hidden="true"
          className="text-primary mt-0.5 size-5 shrink-0"
          strokeWidth={1.8}
        />
        <div>
          <h2 className="text-foreground text-base font-semibold" id={headingId}>
            {title}
          </h2>
          <p className="text-muted mt-1 text-sm leading-6">{description}</p>
        </div>
      </div>
      <div className="p-5 sm:p-6">{children}</div>
    </section>
  );
}

function SummaryFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-border min-w-0 border-b py-3 sm:px-4">
      <dt className="text-muted text-xs">{label}</dt>
      <dd className="text-foreground mt-1 text-sm font-semibold break-words">{value}</dd>
    </div>
  );
}

function SourceFact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-muted text-xs">{label}</dt>
      <dd className="text-foreground mt-1 text-sm font-semibold break-words">{value}</dd>
    </div>
  );
}

function getPriorityPresentation(outcome: RuleEngineOutcome): {
  badge: string;
  description: string;
  title: string;
  tone: ResultTone;
} {
  if (outcome.status === "blocked") {
    const reason = formatBlockedReason(outcome.reason);

    return {
      badge: reason,
      description:
        outcome.reason === "out-of-scope"
          ? "Use an appropriate specialist or pregnancy-specific pathway."
          : "Resolve the listed information or configuration issue before evaluation.",
      title: "Assessment blocked safely",
      tone: outcome.reason === "configuration-error" ? "danger" : "warning",
    };
  }

  if (outcome.status === "unsupported") {
    return {
      badge: "Unsupported",
      description:
        "No definitive NICE-only management pathway matched. Use an approved local protocol or specialist review.",
      title: outcome.priority,
      tone: "warning",
    };
  }

  const urgent = /emergency/i.test(outcome.priority);
  const needsPromptReview = /urgent/i.test(outcome.priority);

  return {
    badge: "NICE rule matched",
    description: outcome.outputStatus,
    title: outcome.priority,
    tone: urgent ? "danger" : needsPromptReview ? "warning" : "info",
  };
}

function getResultHeading(outcome: RuleEngineOutcome): string {
  if (outcome.status === "blocked") {
    return "Assessment result unavailable";
  }

  return outcome.status === "unsupported"
    ? "No definitive NICE-only management output"
    : outcome.outputStatus;
}

function formatBlockedReason(reason: BlockedRuleEvaluation["reason"]): string {
  return {
    "configuration-error": "Configuration error",
    "invalid-input": "Invalid input",
    "missing-required-inputs": "Missing confirmation",
    "out-of-scope": "Outside scope",
  }[reason];
}

function formatPregnancyStatus(value: AssessmentFormState["pregnancyStatus"]): string {
  return pregnancyStatusOptions.find((option) => option.value === value)?.label ?? "Not selected";
}

function formatFactValue(value: RuleResult["explanation"]["facts"][number]["value"]): string {
  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (typeof value === "string" && value.includes("-")) {
    const words = value.replaceAll("-", " ");

    return `${words.charAt(0).toUpperCase()}${words.slice(1)}`;
  }

  return String(value);
}

function formatExplanationSummary(outcome: RuleResult): string {
  if (outcome.status === "unsupported" || outcome.explanation.facts.length === 0) {
    return outcome.explanation.summary;
  }

  const facts = outcome.explanation.facts
    .map((fact) => `${fact.label}: ${formatFactValue(fact.value)}`)
    .join("; ");

  return `Matched ${outcome.ruleId} because ${facts}.`;
}
