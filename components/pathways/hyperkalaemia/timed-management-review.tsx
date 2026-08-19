"use client";

import {
  Activity,
  AlertTriangle,
  CircleCheck,
  CircleHelp,
  Clock3,
  Gauge,
  HeartPulse,
  ShieldCheck,
  Stethoscope,
  TestTube2,
} from "lucide-react";
import { useMemo, useState } from "react";

import {
  GroupedSymptomSelection,
  MajorDecisionCards,
  MonitoringTimeline,
  NumericClinicalInput,
  ResultSection,
  ReviewStatusBadge,
  SafetyAlert,
} from "@/components/clinical";
import { Badge } from "@/components/ui/badge";
import type { PathwayAction, PathwayEscalation, PathwayWarning } from "@/src/clinical/engine";
import {
  DIGOXIN_TOXICITY_OPTIONS,
  HYPERKALAEMIA_ECG_CHANGE_OPTIONS,
  POTASSIUM_UNIT,
  PRETREATMENT_GLUCOSE_INPUT_KEY,
  PRETREATMENT_GLUCOSE_UNIT,
  SALBUTAMOL_CONTEXT_OPTIONS,
  evaluateHyperkalaemiaSeverity,
  evaluateHyperkalaemiaTimedManagement,
  type DigoxinToxicityConcern,
  type HyperkalaemiaEcgChange,
  type HyperkalaemiaSeverity,
  type SalbutamolContext,
} from "@/src/clinical/pathways/hyperkalaemia";

const severityTone = {
  mild: "info",
  moderate: "warning",
  severe: "danger",
} as const satisfies Record<HyperkalaemiaSeverity, "danger" | "info" | "warning">;

const ecgSelectionGroups = [
  {
    id: "conduction",
    label: "Repolarisation and conduction",
    options: HYPERKALAEMIA_ECG_CHANGE_OPTIONS.slice(0, 3),
  },
  {
    id: "rhythm",
    label: "Rhythm and advanced changes",
    options: HYPERKALAEMIA_ECG_CHANGE_OPTIONS.slice(3),
  },
  {
    description: "Select only when none of the six listed changes is confirmed.",
    id: "none",
    label: "No listed change",
    options: [
      {
        label: "None of the listed ECG changes confirmed",
        value: "none-confirmed",
      },
    ],
  },
  {
    description: "Records uncertainty without inferring that changes are present or absent.",
    id: "uncertain",
    label: "Uncertain assessment",
    options: [
      {
        label: "Unable to determine safely",
        value: "unable-to-determine",
      },
    ],
  },
] as const;

const listedChangeValues = new Set<HyperkalaemiaEcgChange>(
  HYPERKALAEMIA_ECG_CHANGE_OPTIONS.map(({ value }) => value),
);

const initialCheckIds = new Set([
  "exclude-pseudohyperkalaemia",
  "check-calcium-bicarbonate",
  "check-chronic-potassium-context",
  "perform-ecg-monitor-rhythm",
]);
const calciumActionIds = new Set([
  "calcium-gluconate-standard",
  "calcium-gluconate-digoxin-consideration",
  "calcium-repeat-if-ecg-persists",
]);
const intracellularShiftActionIds = new Set([
  "check-cbg-before-insulin",
  "insulin-glucose-infusion",
  "low-baseline-glucose-follow-on",
  "salbutamol-ihd-consideration",
  "salbutamol-standard-consideration",
]);
const adjunctActionIds = new Set([
  "sodium-bicarbonate-conditional",
  "furosemide-conditional",
  "dialysis-conditional",
]);
const preventionActionIds = new Set([
  "consider-underlying-hyperkalaemia-causes",
  "review-medication-and-diet",
]);
const ecgEscalationIds = new Set([
  "cardiac-monitoring-resuscitation",
  "consider-outreach-referral",
]);
const conditionalEscalationIds = new Set([
  "unstable-or-multi-organ-failure-escalation",
  "dialysis-transplant-renal-discussion",
  "refractory-or-renal-impairment-discussion",
]);
const managementWarningIds = new Set([
  "moderate-treatment-selection-unresolved",
  "moderate-ecg-uncertain",
  "severe-ecg-uncertain",
  "calcium-duration-not-selected",
  "avoid-salbutamol-tachycardia",
  "salbutamol-context-uncertain",
  "sodium-zirconium-source-conflict",
]);

const monitoringLabels: Record<string, { label: string; timing: string }> = {
  "mild-capillary-glucose": { label: "Capillary blood glucose", timing: "During assessment" },
  "mild-daily-potassium": { label: "Potassium", timing: "Daily" },
  "moderate-capillary-glucose": {
    label: "Capillary blood glucose",
    timing: "During assessment",
  },
  "moderate-insulin-glucose-monitoring": {
    label: "Capillary blood glucose",
    timing: "Baseline to 6 hours",
  },
  "moderate-potassium-monitoring": {
    label: "Potassium",
    timing: "1-2, 4-6 and 24 hours",
  },
  "moderate-treatment-potassium-monitoring": {
    label: "Potassium",
    timing: "1-2, 4-6 and 24 hours",
  },
  "severe-insulin-glucose-monitoring": {
    label: "Capillary blood glucose",
    timing: "Baseline to 6 hours",
  },
  "severe-potassium-monitoring": {
    label: "Potassium",
    timing: "1, 2, 4, 6 and 24 hours",
  },
};

export function HyperkalaemiaTimedManagementReview() {
  const [potassiumInput, setPotassiumInput] = useState("6.5");
  const [ecgChanges, setEcgChanges] = useState<readonly HyperkalaemiaEcgChange[]>([]);
  const [digoxinConcern, setDigoxinConcern] = useState<DigoxinToxicityConcern | "">("");
  const [pretreatmentGlucoseInput, setPretreatmentGlucoseInput] = useState("");
  const [salbutamolContext, setSalbutamolContext] = useState<SalbutamolContext | "">("");
  const potassium = toOptionalNumber(potassiumInput);
  const pretreatmentGlucose = toOptionalNumber(pretreatmentGlucoseInput);
  const severityEvaluation = potassium === null ? null : evaluateHyperkalaemiaSeverity(potassium);
  const evaluation = useMemo(
    () =>
      potassium === null
        ? null
        : evaluateHyperkalaemiaTimedManagement({
            ...(digoxinConcern ? { digoxinToxicityConcern: digoxinConcern } : {}),
            ...(ecgChanges.length > 0 ? { ecgChanges } : {}),
            potassium,
            ...(pretreatmentGlucose === null
              ? {}
              : { pretreatmentBloodGlucose: pretreatmentGlucose }),
            ...(salbutamolContext ? { salbutamolContext } : {}),
          }),
    [digoxinConcern, ecgChanges, potassium, pretreatmentGlucose, salbutamolContext],
  );
  const traceNodeIds = new Set(evaluation?.trace.map(({ nodeId }) => nodeId));
  const requiresEcg =
    severityEvaluation?.kind === "classified" && severityEvaluation.band.severity !== "mild";
  const showDigoxinContext =
    traceNodeIds.has("ecg-changes-confirmed-review") ||
    traceNodeIds.has("seven-plus-digoxin-context");
  const showPretreatmentGlucose = traceNodeIds.has("pretreatment-glucose-input");
  const showSalbutamolContext = traceNodeIds.has("salbutamol-context-question");
  const allActions = [...(evaluation?.immediateActions ?? []), ...(evaluation?.nextActions ?? [])];
  const initialChecks = allActions.filter(({ actionId }) => initialCheckIds.has(actionId));
  const calciumActions = allActions.filter(({ actionId }) => calciumActionIds.has(actionId));
  const intracellularShiftActions = allActions.filter(({ actionId }) =>
    intracellularShiftActionIds.has(actionId),
  );
  const adjunctActions = allActions.filter(({ actionId }) => adjunctActionIds.has(actionId));
  const preventionActions = allActions.filter(({ actionId }) => preventionActionIds.has(actionId));
  const ecgEscalations = (evaluation?.escalations ?? []).filter(({ escalationId }) =>
    ecgEscalationIds.has(escalationId),
  );
  const conditionalEscalations = (evaluation?.escalations ?? []).filter(({ escalationId }) =>
    conditionalEscalationIds.has(escalationId),
  );
  const managementWarnings = (evaluation?.warnings ?? []).filter(({ warningId }) =>
    managementWarningIds.has(warningId),
  );
  const urgentThresholdWarning = evaluation?.warnings.find(
    ({ warningId }) => warningId === "do-not-delay-calcium-for-ecg",
  );
  const confirmedChanges = HYPERKALAEMIA_ECG_CHANGE_OPTIONS.filter(({ value }) =>
    ecgChanges.includes(value),
  );
  const potassiumError =
    severityEvaluation?.kind === "invalid" ? severityEvaluation.message : undefined;
  const glucoseError = getGlucoseError(evaluation, pretreatmentGlucoseInput);
  const managementOutputAvailable =
    evaluation?.status === "requires-clinical-review" ||
    calciumActions.length > 0 ||
    intracellularShiftActions.length > 0 ||
    managementWarnings.length > 0;

  function resetDownstreamFromPotassium() {
    setEcgChanges([]);
    setDigoxinConcern("");
    setPretreatmentGlucoseInput("");
    setSalbutamolContext("");
  }

  function handlePotassiumChange(value: string) {
    setPotassiumInput(value);
    resetDownstreamFromPotassium();
  }

  function handleEcgChanges(nextValues: readonly string[]) {
    const typedValues = nextValues as readonly HyperkalaemiaEcgChange[];
    const selectedNone = typedValues.includes("none-confirmed");
    const selectedUnable = typedValues.includes("unable-to-determine");
    const noneWasSelected = ecgChanges.includes("none-confirmed");
    const unableWasSelected = ecgChanges.includes("unable-to-determine");
    let nextSelection = typedValues;

    if (selectedNone && !noneWasSelected) {
      nextSelection = ["none-confirmed"];
    } else if (selectedUnable && !unableWasSelected) {
      nextSelection = ["unable-to-determine"];
    } else if (typedValues.some((value) => listedChangeValues.has(value))) {
      nextSelection = typedValues.filter(
        (value) => value !== "none-confirmed" && value !== "unable-to-determine",
      );
    }

    setEcgChanges(nextSelection);
    setDigoxinConcern("");
    setPretreatmentGlucoseInput("");
    setSalbutamolContext("");
  }

  function handleDigoxinConcern(value: string) {
    setDigoxinConcern(value as DigoxinToxicityConcern);
    setPretreatmentGlucoseInput("");
    setSalbutamolContext("");
  }

  function handlePretreatmentGlucose(value: string) {
    setPretreatmentGlucoseInput(value);
    setSalbutamolContext("");
  }

  return (
    <article className="border-border bg-surface rounded-lg border shadow-xs">
      <header className="border-border border-b p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-success-strong text-xs font-bold uppercase">
              Connected technical assessment
            </p>
            <h2 className="text-foreground mt-1 text-lg font-bold">
              Potassium, ECG and timed management
            </h2>
          </div>
          <ReviewStatusBadge status="awaiting-clinical-review" />
        </div>
        <p className="text-muted mt-2 max-w-3xl text-sm leading-6">
          Each confirmed answer reveals only the next information needed by the implemented branch.
        </p>
      </header>

      <div className="space-y-6 p-5 sm:p-6">
        <NumericClinicalInput
          description="Use the latest confirmed serum potassium result. Changing it clears all downstream answers."
          id="hyperkalaemia-management-potassium"
          label="Latest potassium result"
          min="0.01"
          onChange={(event) => handlePotassiumChange(event.target.value)}
          required
          step="0.01"
          unit={POTASSIUM_UNIT}
          value={potassiumInput}
          {...(potassiumError ? { error: potassiumError } : {})}
        />

        <div aria-live="polite">
          {severityEvaluation === null ? (
            <AwaitingPanel
              description="Downstream questions remain hidden until a supported potassium result is entered."
              title="Awaiting potassium result"
            />
          ) : null}

          {severityEvaluation?.kind === "unsupported" ? (
            <SafetyAlert level="information" title="No exact source severity band matched">
              {severityEvaluation.message}
            </SafetyAlert>
          ) : null}

          {severityEvaluation?.kind === "classified" ? (
            <ResultSection
              dividers={false}
              headingAs="h3"
              icon={Gauge}
              status="Severity confirmed"
              title={severityEvaluation.band.label}
              tone={severityTone[severityEvaluation.band.severity]}
            >
              <p>
                Potassium <strong>{severityEvaluation.value} mmol/L</strong> matches{" "}
                <strong>{severityEvaluation.band.sourceRangeLabel}</strong>.
              </p>
              <p className="mt-2">{severityEvaluation.band.sourceSummary}</p>
            </ResultSection>
          ) : null}
        </div>

        {severityEvaluation?.kind === "classified" ? (
          <section aria-labelledby="hyperkalaemia-initial-checks-title">
            <SectionHeading
              badge="Source-supported"
              description="Checks shown for the current supported severity."
              icon={ShieldCheck}
              id="hyperkalaemia-initial-checks-title"
              title="Initial checks"
            />
            <ActionList actions={initialChecks} />
          </section>
        ) : null}

        {urgentThresholdWarning ? (
          <SafetyAlert level="critical" title="Urgent threshold safeguard">
            {urgentThresholdWarning.message}
          </SafetyAlert>
        ) : null}

        {severityEvaluation?.kind === "classified" && !requiresEcg ? (
          <SafetyAlert level="information" title="ECG selector not triggered">
            The implemented source threshold requests a 12-lead ECG and rhythm monitoring from 6.0
            mmol/L. This mild branch continues to monitoring and cause review without an
            ECG-dependent treatment instruction.
          </SafetyAlert>
        ) : null}

        {requiresEcg ? (
          <section aria-labelledby="hyperkalaemia-ecg-selection-title">
            <h3 className="sr-only" id="hyperkalaemia-ecg-selection-title">
              ECG change selection
            </h3>
            <GroupedSymptomSelection
              description="Select every listed change that is clinically confirmed, or choose one explicit no-change or uncertainty state."
              groups={ecgSelectionGroups}
              legend="Source-listed ECG changes"
              name="hyperkalaemia-management-ecg-changes"
              onValuesChange={handleEcgChanges}
              values={ecgChanges}
            />

            <div aria-live="polite" className="mt-5">
              {ecgChanges.length === 0 ? (
                <AwaitingPanel
                  description="An explicit answer is required before the connected management branch can continue."
                  title="Confirm ECG findings"
                />
              ) : null}

              {confirmedChanges.length > 0 ? (
                <ResultSection
                  dividers={false}
                  headingAs="h3"
                  icon={Activity}
                  status="Escalation branch"
                  title="ECG changes confirmed"
                  tone="danger"
                >
                  <p>Confirmed: {confirmedChanges.map(({ label }) => label).join(", ")}.</p>
                  <InstructionList items={ecgEscalations} />
                </ResultSection>
              ) : null}
            </div>
          </section>
        ) : null}

        {showDigoxinContext ? (
          <section aria-labelledby="hyperkalaemia-digoxin-context-title">
            <h3 className="sr-only" id="hyperkalaemia-digoxin-context-title">
              Calcium administration context
            </h3>
            <MajorDecisionCards
              description="This answer selects the source-listed calcium administration consideration without inferring digoxin status."
              legend="Is there concern about digoxin toxicity?"
              name="hyperkalaemia-digoxin-context"
              onValueChange={handleDigoxinConcern}
              options={DIGOXIN_TOXICITY_OPTIONS.map((option, index) => ({
                ...option,
                icon: index === 0 ? AlertTriangle : index === 1 ? ShieldCheck : CircleHelp,
              }))}
              required
              value={digoxinConcern}
            />
          </section>
        ) : null}

        {showPretreatmentGlucose ? (
          <section aria-labelledby="hyperkalaemia-glucose-title">
            <SectionHeading
              description="Required before the insulin/glucose branch; changing it clears the downstream salbutamol answer."
              icon={TestTube2}
              id="hyperkalaemia-glucose-title"
              title="Pre-treatment capillary blood glucose"
            />
            <div className="mt-4 max-w-xl">
              <NumericClinicalInput
                id="hyperkalaemia-pretreatment-glucose"
                label="Confirmed pre-treatment blood glucose"
                min="0"
                onChange={(event) => handlePretreatmentGlucose(event.target.value)}
                required
                step="0.01"
                unit={PRETREATMENT_GLUCOSE_UNIT}
                value={pretreatmentGlucoseInput}
                {...(glucoseError ? { error: glucoseError } : {})}
              />
            </div>
          </section>
        ) : null}

        {showSalbutamolContext ? (
          <section aria-labelledby="hyperkalaemia-salbutamol-context-title">
            <h3 className="sr-only" id="hyperkalaemia-salbutamol-context-title">
              Salbutamol context
            </h3>
            <MajorDecisionCards
              description="Choose one clinically confirmed context. An uncertain answer generates no salbutamol instruction."
              legend="Which source-listed salbutamol context applies?"
              name="hyperkalaemia-salbutamol-context"
              onValueChange={(value) => setSalbutamolContext(value as SalbutamolContext)}
              options={SALBUTAMOL_CONTEXT_OPTIONS.map((option, index) => ({
                ...option,
                icon:
                  index === 0
                    ? HeartPulse
                    : index === 1
                      ? Stethoscope
                      : index === 2
                        ? CircleCheck
                        : CircleHelp,
              }))}
              required
              value={salbutamolContext}
            />
          </section>
        ) : null}

        {managementOutputAvailable ? (
          <section aria-labelledby="hyperkalaemia-management-output-title" className="space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3
                  className="text-foreground text-base font-semibold"
                  id="hyperkalaemia-management-output-title"
                >
                  Connected management output
                </h3>
                <p className="text-muted mt-1 text-xs leading-5">
                  Technical transcription for clinical review; not approved for patient care.
                </p>
              </div>
              <Badge variant="review">Locked for review</Badge>
            </div>

            {managementWarnings.map((warning) => (
              <ManagementWarning key={warning.warningId} warning={warning} />
            ))}

            {calciumActions.length > 0 || ecgEscalations.length > 0 ? (
              <ResultSection
                dividers={false}
                headingAs="h3"
                icon={HeartPulse}
                status="First 15-30 minutes"
                title="Protect the heart"
                tone="danger"
              >
                <ActionList actions={calciumActions} compact />
                <InstructionList items={ecgEscalations} />
              </ResultSection>
            ) : null}

            {intracellularShiftActions.length > 0 ? (
              <ResultSection
                dividers={false}
                headingAs="h3"
                icon={Clock3}
                status="Within 30-60 minutes"
                title="Shift potassium into cells"
                tone="info"
              >
                <ActionList actions={intracellularShiftActions} compact />
              </ResultSection>
            ) : null}

            {adjunctActions.length > 0 || conditionalEscalations.length > 0 ? (
              <ResultSection
                dividers={false}
                headingAs="h3"
                icon={Stethoscope}
                status="Condition-dependent"
                title="Relevant escalation and adjuncts"
                tone="warning"
              >
                <InstructionList items={conditionalEscalations} />
                <ActionList actions={adjunctActions} compact />
              </ResultSection>
            ) : null}

            {evaluation && evaluation.monitoring.length > 0 ? (
              <MonitoringTimeline
                dividers={false}
                items={evaluation.monitoring.map((item) => {
                  const metadata = monitoringLabels[item.monitoringId] ?? {
                    label: "Clinical monitoring",
                    timing: "As specified",
                  };

                  return {
                    description: item.instruction,
                    id: item.monitoringId,
                    label: metadata.label,
                    status: "upcoming" as const,
                    timing: metadata.timing,
                  };
                })}
                title="Ongoing monitoring"
              />
            ) : null}

            {preventionActions.length > 0 ? (
              <ResultSection
                dividers={false}
                headingAs="h3"
                icon={ShieldCheck}
                status="All cases"
                title="Cause and recurrence prevention"
                tone="success"
              >
                <ActionList actions={preventionActions} compact />
              </ResultSection>
            ) : null}
          </section>
        ) : null}
      </div>
    </article>
  );
}

function ActionList({
  actions,
  compact = false,
}: {
  actions: readonly PathwayAction[];
  compact?: boolean;
}) {
  if (actions.length === 0) return null;

  return (
    <ul className={compact ? "space-y-2" : "border-border mt-4 divide-y border-y"}>
      {actions.map((action) => (
        <li
          className={
            compact
              ? "flex items-start gap-2"
              : "grid min-h-12 grid-cols-[1.75rem_minmax(0,1fr)] items-start gap-3 py-3"
          }
          key={action.actionId}
        >
          <CircleCheck
            aria-hidden="true"
            className="text-success mt-1 size-4 shrink-0"
            strokeWidth={2}
          />
          <span className="text-foreground text-sm leading-6">{action.instruction}</span>
        </li>
      ))}
    </ul>
  );
}

function InstructionList({ items }: { items: readonly PathwayEscalation[] }) {
  if (items.length === 0) return null;

  return (
    <ul className="mt-3 space-y-2">
      {items.map((item) => (
        <li className="flex items-start gap-2" key={item.escalationId}>
          <AlertTriangle aria-hidden="true" className="text-danger mt-1 size-4 shrink-0" />
          <span>{item.instruction}</span>
        </li>
      ))}
    </ul>
  );
}

function AwaitingPanel({ description, title }: { description: string; title: string }) {
  return (
    <div className="bg-surface-subtle flex items-start gap-3 rounded-md p-4" role="status">
      <CircleHelp aria-hidden="true" className="text-primary mt-0.5 size-5 shrink-0" />
      <div>
        <p className="text-foreground text-sm font-semibold">{title}</p>
        <p className="text-muted mt-1 text-xs leading-5">{description}</p>
      </div>
    </div>
  );
}

function SectionHeading({
  badge,
  description,
  icon: Icon,
  id,
  title,
}: {
  badge?: string;
  description: string;
  icon: typeof ShieldCheck;
  id: string;
  title: string;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h3 className="text-foreground flex items-center gap-2 text-base font-semibold" id={id}>
          <Icon aria-hidden="true" className="text-primary size-5" />
          {title}
        </h3>
        <p className="text-muted mt-1 text-xs leading-5">{description}</p>
      </div>
      {badge ? <Badge variant="review">{badge}</Badge> : null}
    </div>
  );
}

function ManagementWarning({ warning }: { warning: PathwayWarning }) {
  const critical = warning.severity === "critical";
  const titleById: Record<string, string> = {
    "avoid-salbutamol-tachycardia": "Salbutamol avoided",
    "calcium-duration-not-selected": "Calcium duration requires urgent review",
    "moderate-ecg-uncertain": "ECG assessment requires review",
    "moderate-treatment-selection-unresolved": "No deterministic moderate-treatment selection",
    "salbutamol-context-uncertain": "No salbutamol instruction generated",
    "severe-ecg-uncertain": "Urgent ECG review required",
    "sodium-zirconium-source-conflict": "Conflicting sodium-zirconium criteria",
  };

  return (
    <SafetyAlert
      level={critical ? "critical" : "warning"}
      title={titleById[warning.warningId] ?? "Management review note"}
    >
      {warning.message}
    </SafetyAlert>
  );
}

function toOptionalNumber(value: string): number | null {
  return value.trim() === "" ? null : Number(value);
}

function getGlucoseError(
  evaluation: ReturnType<typeof evaluateHyperkalaemiaTimedManagement> | null,
  rawValue: string,
): string | undefined {
  if (rawValue.trim() === "") return undefined;
  const value = Number(rawValue);

  if (!Number.isFinite(value)) return "Enter a finite numeric blood-glucose result.";

  const issue = evaluation?.issues.find(({ field }) => field === PRETREATMENT_GLUCOSE_INPUT_KEY);

  if (!issue) return undefined;
  if (/decimal places/i.test(issue.message)) return "Enter no more than 2 decimal places.";
  if (/accepted range/i.test(issue.message)) return "Enter a result of 0 mmol/L or greater.";
  if (/expected unit/i.test(issue.message)) return `Use ${PRETREATMENT_GLUCOSE_UNIT}.`;
  return "Check the pre-treatment blood-glucose result.";
}
