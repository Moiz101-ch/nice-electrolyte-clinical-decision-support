"use client";

import * as Dialog from "@radix-ui/react-dialog";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  Beaker,
  CircleCheck,
  CircleHelp,
  CircleX,
  ClipboardCheck,
  Droplets,
  Gauge,
  RotateCcw,
  Scale,
  ShieldAlert,
  ShieldCheck,
  ShieldQuestion,
  TestTube2,
  Waves,
} from "lucide-react";
import { useMemo, useReducer, useState, type ReactNode } from "react";

import {
  GroupedSymptomSelection,
  MajorDecisionCards,
  MonitoringTimeline,
  NumericClinicalInput,
  PathwayProgress,
  ResultSection,
  ReviewStatusBadge,
  SafetyAlert,
} from "@/components/clinical";
import { HyponatraemiaOperationalResultReview } from "@/components/pathways/hyponatraemia/operational-result-review";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CEREBRAL_OEDEMA_SIGN_OPTIONS,
  EUVOLAEMIC_UNDERLYING_CAUSE_OPTIONS,
  HYPONATRAEMIA_FLUID_STATUS_OPTIONS,
  HYPONATRAEMIA_SYMPTOM_RESPONSE_OPTIONS,
  ODS_RISK_OPTIONS,
  OSMOLALITY_UNIT,
  SODIUM_UNIT,
  URINE_SODIUM_UNIT,
  evaluateHyponatraemiaConnectedAssessment,
  type CerebralOedemaSign,
  type EuvolaemicUnderlyingCause,
  type HyponatraemiaConnectedAssessmentEvaluation,
  type HyponatraemiaConnectedAssessmentInput,
  type HyponatraemiaFluidStatus,
  type HyponatraemiaSymptomResponse,
  type OdsRiskStatus,
} from "@/src/clinical/pathways/hyponatraemia";

import {
  hyponatraemiaAssessmentReducer,
  initialHyponatraemiaAssessmentState,
  type HyponatraemiaAssessmentViewState,
  type UrineResultAvailability,
} from "./connected-assessment-state";

type AssessmentStage =
  "classification" | "context" | "emergency" | "management" | "result" | "severity";

const fluidStatusIcons = {
  euvolaemic: Scale,
  hypervolaemic: Waves,
  hypovolaemic: Droplets,
  "unable-to-establish": CircleHelp,
} as const;

const odsRiskIcons = {
  "high-risk-confirmed": ShieldAlert,
  "high-risk-not-confirmed": ShieldCheck,
  "unable-to-assess": ShieldQuestion,
} as const;

const responseIcons = {
  improved: CircleCheck,
  "not-improved": CircleX,
  "unable-to-assess": CircleHelp,
} as const;

const euvolaemicCauseIcons = {
  "other-or-unresolved": Activity,
  "siadh-established": ShieldCheck,
  "unable-to-establish": CircleHelp,
  "water-intoxication-established": Droplets,
} as const;

const symptomGroups = [
  {
    id: "general",
    label: "General signs",
    options: CEREBRAL_OEDEMA_SIGN_OPTIONS.filter((option) =>
      ["nausea", "vomiting", "headache"].includes(option.value),
    ),
  },
  {
    id: "neurological",
    label: "Neurological signs",
    options: CEREBRAL_OEDEMA_SIGN_OPTIONS.filter((option) =>
      ["low-gcs", "ataxia", "confusion"].includes(option.value),
    ),
  },
  {
    description: "Select this only when none of the six listed signs is confirmed.",
    id: "none",
    label: "No listed sign",
    options: [{ label: "None of the listed signs confirmed", value: "none-confirmed" }],
  },
] as const;

const availabilityOptions = [
  {
    description: "Continue with the confirmed serum and urine measurements.",
    icon: TestTube2,
    label: "Yes - results available",
    value: "available",
  },
  {
    description: "Record that classification cannot be completed from current results.",
    icon: CircleHelp,
    label: "No - not available",
    value: "not-available",
  },
] as const;

export function HyponatraemiaConnectedAssessmentReview() {
  const [state, dispatch] = useReducer(
    hyponatraemiaAssessmentReducer,
    initialHyponatraemiaAssessmentState,
  );
  const [currentStage, setCurrentStage] = useState<AssessmentStage>("severity");
  const [resetOpen, setResetOpen] = useState(false);
  const evaluation = useMemo(() => evaluateState(state), [state]);
  const steps = assessmentSteps(evaluation, state);
  const canContinue = stageIsComplete(currentStage, evaluation);

  function continueAssessment() {
    if (!evaluation || !canContinue) return;

    switch (currentStage) {
      case "severity":
        setCurrentStage("context");
        break;
      case "context":
        setCurrentStage(evaluation.emergencyRequired ? "emergency" : "classification");
        break;
      case "emergency":
        setCurrentStage("classification");
        break;
      case "classification":
        setCurrentStage(evaluation.euvolaemicCauseRequired ? "management" : "result");
        break;
      case "management":
        setCurrentStage("result");
        break;
      case "result":
        break;
    }
  }

  function goBack() {
    if (!evaluation) {
      setCurrentStage("severity");
      return;
    }

    switch (currentStage) {
      case "severity":
        break;
      case "context":
        setCurrentStage("severity");
        break;
      case "emergency":
        setCurrentStage("context");
        break;
      case "classification":
        setCurrentStage(evaluation.emergencyRequired ? "emergency" : "context");
        break;
      case "management":
        setCurrentStage("classification");
        break;
      case "result":
        setCurrentStage(evaluation.euvolaemicCauseRequired ? "management" : "classification");
        break;
    }
  }

  function resetAssessment() {
    dispatch({ type: "reset" });
    setCurrentStage("severity");
    setResetOpen(false);
  }

  function handleSignsChange(nextValues: readonly string[]) {
    const changedValue = nextValues.find(
      (value) => !state.cerebralOedemaSigns.includes(value as CerebralOedemaSign),
    );
    const signs =
      changedValue === "none-confirmed"
        ? (["none-confirmed"] as const)
        : (nextValues.filter((value) => value !== "none-confirmed") as CerebralOedemaSign[]);

    dispatch({ type: "set-signs", value: signs });
  }

  return (
    <div className="space-y-6">
      <PathwayProgress
        ariaLabel="Connected Hyponatraemia assessment progress"
        currentStepId={currentStage}
        steps={steps}
      />

      {currentStage === "severity" ? (
        <SeverityStage
          evaluation={evaluation}
          onSodiumChange={(value) => dispatch({ type: "set-sodium", value })}
          sodium={state.sodium}
        />
      ) : null}

      {currentStage === "context" && evaluation ? (
        <ContextStage
          evaluation={evaluation}
          onFluidStatusChange={(value) => dispatch({ type: "set-fluid-status", value })}
          onSignsChange={handleSignsChange}
          state={state}
        />
      ) : null}

      {currentStage === "emergency" && evaluation ? (
        <EmergencyStage
          evaluation={evaluation}
          onFourHourChange={(value) => dispatch({ type: "set-four-hour-change", value })}
          onOdsRiskChange={(value) => dispatch({ type: "set-ods-risk", value })}
          onSymptomResponseChange={(value) => dispatch({ type: "set-symptom-response", value })}
          state={state}
        />
      ) : null}

      {currentStage === "classification" && evaluation ? (
        <ClassificationStage
          evaluation={evaluation}
          onAvailabilityChange={(value) =>
            dispatch({ type: "set-urine-results-availability", value })
          }
          onSerumOsmolalityChange={(value) => dispatch({ type: "set-serum-osmolality", value })}
          onUrineOsmolalityChange={(value) => dispatch({ type: "set-urine-osmolality", value })}
          onUrineSodiumChange={(value) => dispatch({ type: "set-urine-sodium", value })}
          state={state}
        />
      ) : null}

      {currentStage === "management" && evaluation ? (
        <ManagementStage
          evaluation={evaluation}
          onUnderlyingCauseChange={(value) =>
            dispatch({ type: "set-euvolaemic-underlying-cause", value })
          }
          state={state}
        />
      ) : null}

      {currentStage === "result" && evaluation ? (
        <HyponatraemiaOperationalResultReview
          contextLabel="Connected assessment result"
          explanationDescription="Deterministic explanation from the confirmed assessment inputs"
          result={evaluation.operationalResult}
        />
      ) : null}

      <AssessmentNavigation
        canContinue={canContinue}
        currentStage={currentStage}
        onBack={goBack}
        onContinue={continueAssessment}
        onReset={() => setResetOpen(true)}
        reviewResultNext={
          currentStage === "management" ||
          (currentStage === "classification" && !evaluation?.euvolaemicCauseRequired)
        }
      />

      <ResetAssessmentDialog
        onConfirm={resetAssessment}
        onOpenChange={setResetOpen}
        open={resetOpen}
      />
    </div>
  );
}

function SeverityStage({
  evaluation,
  onSodiumChange,
  sodium,
}: {
  evaluation: HyponatraemiaConnectedAssessmentEvaluation | null;
  onSodiumChange: (value: string) => void;
  sodium: string;
}) {
  const severity = evaluation?.severity ?? null;
  const error = severity?.kind === "invalid" ? severity.message : undefined;

  return (
    <StageShell description="Enter the latest confirmed measurement." title="Confirm sodium result">
      <div className="max-w-xl">
        <NumericClinicalInput
          description="Use mmol/L and no more than 1 decimal place."
          id="connected-sodium-result"
          label="Latest sodium result"
          min="0.1"
          onChange={(event) => onSodiumChange(event.target.value)}
          required
          step="0.1"
          unit={SODIUM_UNIT}
          value={sodium}
          {...(error ? { error } : {})}
        />
      </div>

      <div aria-live="polite" className="mt-6">
        {!severity ? (
          <ResultSection icon={Gauge} status="Awaiting input" title="Enter sodium">
            No severity band has been selected.
          </ResultSection>
        ) : severity.kind === "classified" ? (
          <ResultSection
            icon={Activity}
            status={severity.band.sourceRangeLabel}
            title={severity.band.label}
            tone={severity.band.severity === "severe" ? "danger" : "info"}
          >
            Sodium {severity.value} {severity.unit} is within the implemented{" "}
            {severity.band.severity}
            band.
          </ResultSection>
        ) : severity.kind === "unsupported" ? (
          <SafetyAlert level="warning" title="No implemented severity band">
            {severity.message}
          </SafetyAlert>
        ) : (
          <SafetyAlert level="critical" title="Sodium input blocked">
            Correct the sodium value before continuing.
          </SafetyAlert>
        )}
      </div>
    </StageShell>
  );
}

function ContextStage({
  evaluation,
  onFluidStatusChange,
  onSignsChange,
  state,
}: {
  evaluation: HyponatraemiaConnectedAssessmentEvaluation;
  onFluidStatusChange: (value: HyponatraemiaFluidStatus) => void;
  onSignsChange: (values: readonly string[]) => void;
  state: HyponatraemiaAssessmentViewState;
}) {
  const requiresSigns = state.fluidStatus === "hypovolaemic" || state.fluidStatus === "euvolaemic";

  return (
    <StageShell
      description={`${severitySummary(evaluation)}. Confirm the current clinical context.`}
      title="Establish clinical context"
    >
      <MajorDecisionCards
        description="Choose one clinically established volume state. Uncertainty stops downstream inference."
        legend="Establish fluid status"
        name="connected-fluid-status"
        onValueChange={(value) => onFluidStatusChange(value as HyponatraemiaFluidStatus)}
        options={HYPONATRAEMIA_FLUID_STATUS_OPTIONS.map((option) => ({
          description: option.description,
          icon: fluidStatusIcons[option.value],
          label: option.label,
          value: option.value,
        }))}
        required
        value={state.fluidStatus ?? ""}
      />

      {requiresSigns ? (
        <div className="border-border mt-6 border-t pt-6">
          <GroupedSymptomSelection
            description="Select every listed sign that is clinically confirmed."
            groups={symptomGroups}
            legend="Signs of cerebral oedema present?"
            name="connected-cerebral-oedema-signs"
            onValuesChange={onSignsChange}
            values={state.cerebralOedemaSigns}
          />
        </div>
      ) : null}

      <div aria-live="polite" className="mt-6">
        <ContextOutcome evaluation={evaluation} state={state} />
      </div>
    </StageShell>
  );
}

function EmergencyStage({
  evaluation,
  onFourHourChange,
  onOdsRiskChange,
  onSymptomResponseChange,
  state,
}: {
  evaluation: HyponatraemiaConnectedAssessmentEvaluation;
  onFourHourChange: (value: string) => void;
  onOdsRiskChange: (value: OdsRiskStatus) => void;
  onSymptomResponseChange: (value: HyponatraemiaSymptomResponse) => void;
  state: HyponatraemiaAssessmentViewState;
}) {
  const snapshot = evaluation.emergency;
  const showOdsRisk =
    snapshot.currentNode?.id === "ods-risk-question" || state.odsRiskStatus !== null;
  const showResponse =
    snapshot.currentNode?.id !== "ods-risk-question" &&
    snapshot.currentNode?.id !== "emergency-monitoring-review-required";
  const requiresFourHourChange =
    state.symptomResponse === "not-improved" || state.symptomResponse === "unable-to-assess";
  const fourHourError = numericSnapshotError(
    snapshot,
    "fourHourSodiumChange",
    state.fourHourSodiumChange,
  );

  return (
    <StageShell
      description={`${severitySummary(evaluation)} | ${fluidStatusLabel(state.fluidStatus)} | ${confirmedSignSummary(state.cerebralOedemaSigns)}`}
      title="Complete emergency follow-up"
      tone="danger"
    >
      <SafetyAlert level="critical" title="Unapproved treatment preview - do not use clinically">
        Use the current approved local pathway and emergency escalation process for patient care.
      </SafetyAlert>

      <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.65fr)]">
        <PathwayActionList actions={snapshot.immediateActions} title="Immediate actions" />
        {snapshot.information.map((item) => (
          <ResultSection
            description="Initial correction goal"
            icon={Gauge}
            key={item.nodeId}
            status="First 2-4 hours"
            title="Correction target"
            tone="info"
          >
            {item.body}
          </ResultSection>
        ))}
      </div>

      <div className="mt-6 space-y-3">
        {snapshot.warnings.map((warning) => (
          <SafetyAlert key={warning.warningId} level="critical" title="Maximum correction limit">
            {warning.message}
          </SafetyAlert>
        ))}
      </div>

      {showOdsRisk ? (
        <div className="border-border mt-6 border-t pt-6">
          <MajorDecisionCards
            description="Confirm the clinically established ODS-risk state. The implemented material does not define the risk criteria."
            legend="Is high risk of osmotic demyelination syndrome clinically confirmed?"
            name="connected-ods-risk-status"
            onValueChange={(value) => onOdsRiskChange(value as OdsRiskStatus)}
            options={ODS_RISK_OPTIONS.map((option) => ({
              description: option.description,
              icon: odsRiskIcons[option.value],
              label: option.label,
              value: option.value,
            }))}
            required
            value={state.odsRiskStatus ?? ""}
          />
        </div>
      ) : null}

      {snapshot.monitoring.length > 0 ? (
        <div className="border-border mt-6 border-t pt-6">
          <MonitoringTimeline
            items={snapshot.monitoring.map((item, index) => ({
              description: item.instruction,
              id: item.monitoringId,
              label: index === 0 ? "Initial sodium checks" : "Ongoing sodium checks",
              status: index === 0 ? "current" : "upcoming",
              timing: index === 0 ? "Hourly until the target increase" : "Then every 4-6 hours",
            }))}
            title="Monitoring"
          />
        </div>
      ) : null}

      {showResponse ? (
        <div className="border-border mt-6 border-t pt-6">
          <MajorDecisionCards
            description="Confirm the clinical response after the initial treatment."
            legend="Has there been symptomatic improvement?"
            name="connected-symptom-response"
            onValueChange={(value) =>
              onSymptomResponseChange(value as HyponatraemiaSymptomResponse)
            }
            options={HYPONATRAEMIA_SYMPTOM_RESPONSE_OPTIONS.map((option) => ({
              description: option.description,
              icon: responseIcons[option.value],
              label: option.label,
              value: option.value,
            }))}
            required
            value={state.symptomResponse ?? ""}
          />
        </div>
      ) : null}

      {requiresFourHourChange ? (
        <div className="border-border mt-6 max-w-xl border-t pt-6">
          <NumericClinicalInput
            description="Enter the confirmed change from the pre-treatment sodium result at four hours."
            id="connected-four-hour-change"
            label="Sodium change at 4 hours"
            onChange={(event) => onFourHourChange(event.target.value)}
            required
            step="0.1"
            unit={SODIUM_UNIT}
            value={state.fourHourSodiumChange}
            {...(fourHourError ? { error: fourHourError } : {})}
          />
        </div>
      ) : null}

      <div aria-live="polite" className="mt-6">
        <EmergencyOutcome evaluation={evaluation} state={state} />
      </div>
    </StageShell>
  );
}

function ClassificationStage({
  evaluation,
  onAvailabilityChange,
  onSerumOsmolalityChange,
  onUrineOsmolalityChange,
  onUrineSodiumChange,
  state,
}: {
  evaluation: HyponatraemiaConnectedAssessmentEvaluation;
  onAvailabilityChange: (value: UrineResultAvailability) => void;
  onSerumOsmolalityChange: (value: string) => void;
  onUrineOsmolalityChange: (value: string) => void;
  onUrineSodiumChange: (value: string) => void;
  state: HyponatraemiaAssessmentViewState;
}) {
  const classification = evaluation.classification;
  const snapshot = classification.snapshot;
  const resultsAvailable = state.urineResultsAvailability === "available";
  const hypotonic = classification.serumTonicity === "hypotonic";
  const showHypovolaemicUrineSodium = hypotonic && state.fluidStatus === "hypovolaemic";
  const showEuvolaemicUrineOsmolality = hypotonic && state.fluidStatus === "euvolaemic";
  const showEuvolaemicUrineSodium =
    showEuvolaemicUrineOsmolality &&
    (snapshot.currentNode?.id === "euvolaemic-urine-sodium-input" ||
      state.urineSodium.trim() !== "");

  return (
    <StageShell
      description={`${severitySummary(evaluation)} | ${fluidStatusLabel(state.fluidStatus)}`}
      title="Complete laboratory classification"
    >
      <SafetyAlert level="warning" title="Required exclusion checks">
        Rule out hypothyroidism and secondary adrenal insufficiency in all cases.
      </SafetyAlert>

      <div className="mt-6">
        <MajorDecisionCards
          description="Unavailable urine results pause classification without removing any completed emergency output."
          legend="Are urine results available?"
          name="connected-urine-results-available"
          onValueChange={(value) => onAvailabilityChange(value as UrineResultAvailability)}
          options={availabilityOptions}
          required
          value={state.urineResultsAvailability ?? ""}
        />
      </div>

      {resultsAvailable ? (
        <div className="border-border mt-6 max-w-xl border-t pt-6">
          <NumericClinicalInput
            description="Used to classify the result as hypotonic, isotonic or hypertonic."
            id="connected-serum-osmolality"
            label="Serum osmolality"
            min="0.1"
            onChange={(event) => onSerumOsmolalityChange(event.target.value)}
            required
            step="0.1"
            unit={OSMOLALITY_UNIT}
            value={state.serumOsmolality}
            {...errorProps(snapshot, "serumOsmolality", state.serumOsmolality)}
          />
        </div>
      ) : null}

      {hypotonic ? (
        <ResultSection
          description="Inherited from the connected clinical-context stage"
          icon={fluidStatusIcons[state.fluidStatus ?? "unable-to-establish"]}
          status="Confirmed"
          title={fluidStatusLabel(state.fluidStatus)}
          tone="info"
        >
          This volume state is applied to the hypotonic classification branch.
        </ResultSection>
      ) : null}

      {showHypovolaemicUrineSodium ? (
        <div className="border-border mt-6 max-w-xl border-t pt-6">
          <NumericClinicalInput
            description="Used to distinguish compatible non-renal and renal salt-loss categories."
            id="connected-hypovolaemic-urine-sodium"
            label="Urine sodium"
            min="0"
            onChange={(event) => onUrineSodiumChange(event.target.value)}
            required
            step="0.1"
            unit={URINE_SODIUM_UNIT}
            value={state.urineSodium}
            {...errorProps(snapshot, "hypovolaemicUrineSodium", state.urineSodium)}
          />
        </div>
      ) : null}

      {showEuvolaemicUrineOsmolality ? (
        <div className="border-border mt-6 max-w-xl border-t pt-6">
          <NumericClinicalInput
            description="Used first in the euvolaemic hypotonic branch."
            id="connected-urine-osmolality"
            label="Urine osmolality"
            min="0.1"
            onChange={(event) => onUrineOsmolalityChange(event.target.value)}
            required
            step="0.1"
            unit={OSMOLALITY_UNIT}
            value={state.urineOsmolality}
            {...errorProps(snapshot, "urineOsmolality", state.urineOsmolality)}
          />
        </div>
      ) : null}

      {showEuvolaemicUrineSodium ? (
        <div className="border-border mt-6 max-w-xl border-t pt-6">
          <NumericClinicalInput
            description="Required when the active euvolaemic branch requests urine sodium."
            id="connected-euvolaemic-urine-sodium"
            label="Urine sodium"
            min="0"
            onChange={(event) => onUrineSodiumChange(event.target.value)}
            required
            step="0.1"
            unit={URINE_SODIUM_UNIT}
            value={state.urineSodium}
            {...errorProps(snapshot, "euvolaemicUrineSodium", state.urineSodium)}
          />
        </div>
      ) : null}

      <div aria-live="polite" className="mt-6">
        <ClassificationOutcome evaluation={evaluation} state={state} />
      </div>
    </StageShell>
  );
}

function ManagementStage({
  evaluation,
  onUnderlyingCauseChange,
  state,
}: {
  evaluation: HyponatraemiaConnectedAssessmentEvaluation;
  onUnderlyingCauseChange: (value: EuvolaemicUnderlyingCause) => void;
  state: HyponatraemiaAssessmentViewState;
}) {
  const selectedOption = EUVOLAEMIC_UNDERLYING_CAUSE_OPTIONS.find(
    (option) => option.value === state.euvolaemicUnderlyingCause,
  );
  const patternLabel = evaluation.classification.causePattern?.label;

  return (
    <StageShell
      description="Confirm an underlying cause only when it has been established clinically. A compatible laboratory pattern is not a diagnosis."
      title="Complete euvolaemic cause review"
    >
      {patternLabel ? (
        <ResultSection
          description="Classification context only"
          icon={Beaker}
          status="Not a diagnosis"
          title={patternLabel}
          tone="info"
        >
          Use this compatible pattern as supporting context; do not use it to infer the clinical
          cause automatically.
        </ResultSection>
      ) : null}

      <div className={patternLabel ? "border-border mt-6 border-t pt-6" : undefined}>
        <MajorDecisionCards
          description="Choose one mutually exclusive state. Uncertainty stops cause-specific treatment selection."
          legend="Clinically established euvolaemic cause"
          name="connected-euvolaemic-underlying-cause"
          onValueChange={(value) => onUnderlyingCauseChange(value as EuvolaemicUnderlyingCause)}
          options={EUVOLAEMIC_UNDERLYING_CAUSE_OPTIONS.map((option) => ({
            description: option.description,
            icon: euvolaemicCauseIcons[option.value],
            label: option.label,
            value: option.value,
          }))}
          required
          value={state.euvolaemicUnderlyingCause ?? ""}
        />
      </div>

      <div aria-live="polite" className="mt-6">
        {selectedOption ? (
          evaluation.management.nextActions.length > 0 ? (
            <PathwayActionList
              actions={evaluation.management.nextActions}
              title="Selected management endpoint"
            />
          ) : (
            <ResultSection
              description={selectedOption.label}
              icon={ClipboardCheck}
              status="Clinical review required"
              title="No cause-specific action selected"
              tone="warning"
            >
              Continue to the result without inferring an unsupported management instruction.
            </ResultSection>
          )
        ) : (
          <ResultSection
            description="Choose one explicit cause state to continue"
            icon={ClipboardCheck}
            status="Awaiting input"
            title="Confirm the underlying cause"
            tone="warning"
          >
            The euvolaemic branch will not infer a cause from laboratory values alone.
          </ResultSection>
        )}
      </div>

      {evaluation.management.warnings
        .filter((warning) => warning.warningId === "siadh-source-not-supplied")
        .map((warning) => (
          <div className="mt-4" key={warning.warningId}>
            <SafetyAlert level="warning" title="Dedicated SIADH pathway not supplied">
              {warning.message}
            </SafetyAlert>
          </div>
        ))}
    </StageShell>
  );
}

function StageShell({
  children,
  description,
  title,
  tone = "info",
}: {
  children: ReactNode;
  description: string;
  title: string;
  tone?: "danger" | "info";
}) {
  return (
    <article className="border-border bg-surface border-y">
      <header className="border-border flex flex-col gap-4 border-b p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
        <div>
          <p
            className={
              tone === "danger"
                ? "text-danger text-xs font-bold uppercase"
                : "text-primary text-xs font-bold uppercase"
            }
          >
            Connected assessment
          </p>
          <h2 className="text-foreground mt-1 text-lg font-bold">{title}</h2>
          <p className="text-muted mt-1 text-sm leading-6">{description}</p>
        </div>
        <ReviewStatusBadge status="awaiting-clinical-review" />
      </header>
      <div className="p-5 sm:p-6">{children}</div>
    </article>
  );
}

function ContextOutcome({
  evaluation,
  state,
}: {
  evaluation: HyponatraemiaConnectedAssessmentEvaluation;
  state: HyponatraemiaAssessmentViewState;
}) {
  if (evaluation.fluidStatus.status === "blocked") {
    return (
      <SafetyAlert level="critical" title="Clinical context blocked">
        Correct the contradictory or invalid answer before continuing.
      </SafetyAlert>
    );
  }

  if (!state.fluidStatus) {
    return (
      <ResultSection icon={Gauge} status="Awaiting input" title="Select fluid status">
        No volume-state branch has been selected.
      </ResultSection>
    );
  }

  if (
    (state.fluidStatus === "euvolaemic" || state.fluidStatus === "hypovolaemic") &&
    state.cerebralOedemaSigns.length === 0
  ) {
    return (
      <ResultSection icon={ClipboardCheck} status="Awaiting input" title="Confirm listed signs">
        An explicit sign check is required before the branch can continue.
      </ResultSection>
    );
  }

  if (evaluation.emergencyRequired) {
    return (
      <SafetyAlert level="critical" title="Emergency branch selected">
        One or more listed signs is confirmed. The connected emergency follow-up is required next.
      </SafetyAlert>
    );
  }

  if (state.fluidStatus === "unable-to-establish") {
    return (
      <SafetyAlert level="warning" title="Fluid status requires clinical review">
        No volume-specific management branch has been inferred.
      </SafetyAlert>
    );
  }

  return (
    <ResultSection
      icon={CircleCheck}
      status="Complete"
      title="Clinical context confirmed"
      tone="success"
    >
      {fluidStatusLabel(state.fluidStatus)} is recorded with no emergency-treatment branch selected.
    </ResultSection>
  );
}

function EmergencyOutcome({
  evaluation,
  state,
}: {
  evaluation: HyponatraemiaConnectedAssessmentEvaluation;
  state: HyponatraemiaAssessmentViewState;
}) {
  const snapshot = evaluation.emergency;

  if (snapshot.status === "blocked") {
    return (
      <SafetyAlert level="critical" title="Emergency follow-up blocked">
        Correct the highlighted response before continuing.
      </SafetyAlert>
    );
  }

  if (evaluation.completion.emergency) {
    const repeatedDose = snapshot.immediateActions.some(
      (action) => action.actionId === "repeat-hypertonic-saline-dose",
    );
    return (
      <div className="space-y-5">
        <ResultSection
          icon={repeatedDose ? ShieldAlert : CircleCheck}
          status="Clinical review required"
          title={repeatedDose ? "Repeat-treatment endpoint" : "Emergency response recorded"}
          tone={repeatedDose ? "danger" : "success"}
        >
          {snapshot.stopReason}
        </ResultSection>
        {repeatedDose ? (
          <PathwayActionList
            actions={snapshot.immediateActions.filter(
              (action) => action.actionId === "repeat-hypertonic-saline-dose",
            )}
            title="Immediate repeat action"
          />
        ) : null}
        {snapshot.nextActions.length > 0 ? (
          <PathwayActionList actions={snapshot.nextActions} title="Next action" />
        ) : null}
      </div>
    );
  }

  const awaiting =
    snapshot.currentNode?.id === "ods-risk-question"
      ? "Confirm ODS risk status"
      : state.symptomResponse === null
        ? "Confirm symptomatic response"
        : "Enter the four-hour sodium change";

  return (
    <ResultSection icon={ClipboardCheck} status="Awaiting input" title={awaiting}>
      The emergency branch remains paused until the required response is confirmed.
    </ResultSection>
  );
}

function ClassificationOutcome({
  evaluation,
  state,
}: {
  evaluation: HyponatraemiaConnectedAssessmentEvaluation;
  state: HyponatraemiaAssessmentViewState;
}) {
  const { causePattern, serumTonicity, snapshot } = evaluation.classification;

  if (snapshot.status === "blocked") {
    return (
      <SafetyAlert level="critical" title="Classification input blocked">
        Correct the highlighted value before continuing.
      </SafetyAlert>
    );
  }

  if (!state.urineResultsAvailability) {
    return (
      <ResultSection icon={TestTube2} status="Awaiting input" title="Confirm result availability">
        No laboratory classification has been attempted.
      </ResultSection>
    );
  }

  if (state.urineResultsAvailability === "not-available") {
    return (
      <ResultSection
        icon={CircleHelp}
        status="Classification paused"
        title="Results unavailable"
        tone="warning"
      >
        The final review will retain completed emergency output without a compatible cause category.
      </ResultSection>
    );
  }

  if (causePattern) {
    return (
      <ResultSection
        description="Compatible category only - not a definitive diagnosis"
        icon={Beaker}
        status={serumTonicity ? `${capitalise(serumTonicity)} pattern` : "Classified"}
        title={causePattern.label}
        tone="info"
      >
        {causePattern.summary}
      </ResultSection>
    );
  }

  if (snapshot.status === "requires-clinical-review") {
    return (
      <SafetyAlert level="warning" title="Classification requires clinical review">
        {snapshot.stopReason}
      </SafetyAlert>
    );
  }

  return (
    <ResultSection icon={Beaker} status="Awaiting input" title="Complete active measurements">
      No compatible cause category has been selected yet.
    </ResultSection>
  );
}

function PathwayActionList({
  actions,
  title,
}: {
  actions: HyponatraemiaConnectedAssessmentEvaluation["emergency"]["immediateActions"];
  title: string;
}) {
  return (
    <section>
      <h3 className="text-foreground text-base font-semibold">{title}</h3>
      <ol className="border-border mt-4 divide-y border-y">
        {actions.map((action, index) => (
          <li className="grid grid-cols-[2rem_minmax(0,1fr)] gap-3 py-4" key={action.actionId}>
            <span className="bg-info-subtle text-primary flex size-8 items-center justify-center rounded-full text-xs font-bold">
              {index + 1}
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-foreground text-sm font-semibold">
                  {actionLabel(action.actionId)}
                </p>
                <Badge variant={action.timing === "immediate" ? "danger" : "info"}>
                  {action.timing}
                </Badge>
              </div>
              <p className="text-muted mt-1 text-sm leading-6">{action.instruction}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function AssessmentNavigation({
  canContinue,
  currentStage,
  onBack,
  onContinue,
  onReset,
  reviewResultNext,
}: {
  canContinue: boolean;
  currentStage: AssessmentStage;
  onBack: () => void;
  onContinue: () => void;
  onReset: () => void;
  reviewResultNext: boolean;
}) {
  return (
    <nav
      aria-label="Assessment controls"
      className="border-border flex flex-col gap-3 border-y py-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex flex-wrap gap-2">
        <Button
          disabled={currentStage === "severity"}
          onClick={onBack}
          type="button"
          variant="secondary"
        >
          <ArrowLeft aria-hidden="true" />
          Back
        </Button>
        <Button onClick={onReset} type="button" variant="ghost">
          <RotateCcw aria-hidden="true" />
          Start over
        </Button>
      </div>
      {currentStage !== "result" ? (
        <Button disabled={!canContinue} onClick={onContinue} type="button">
          {reviewResultNext ? "Review result" : "Continue"}
          <ArrowRight aria-hidden="true" />
        </Button>
      ) : (
        <Badge variant="review">Assessment review complete</Badge>
      )}
    </nav>
  );
}

function ResetAssessmentDialog({
  onConfirm,
  onOpenChange,
  open,
}: {
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}) {
  return (
    <Dialog.Root onOpenChange={onOpenChange} open={open}>
      <Dialog.Portal>
        <Dialog.Overlay className="bg-foreground/35 fixed inset-0 z-50" />
        <Dialog.Content className="border-border bg-surface fixed top-1/2 left-1/2 z-50 w-[min(28rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-md border p-5 shadow-xl sm:p-6">
          <Dialog.Title className="text-foreground text-lg font-bold">
            Start assessment again?
          </Dialog.Title>
          <Dialog.Description className="text-muted mt-2 text-sm leading-6">
            All answers in this browser view will be cleared.
          </Dialog.Description>
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Dialog.Close asChild>
              <Button type="button" variant="secondary">
                Cancel
              </Button>
            </Dialog.Close>
            <Button onClick={onConfirm} type="button" variant="danger">
              Clear assessment
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function evaluateState(
  state: HyponatraemiaAssessmentViewState,
): HyponatraemiaConnectedAssessmentEvaluation | null {
  const sodium = optionalNumber(state.sodium);
  if (sodium === undefined) return null;

  const input: HyponatraemiaConnectedAssessmentInput = {
    sodium,
    ...(state.fluidStatus ? { fluidStatus: state.fluidStatus } : {}),
    ...(state.cerebralOedemaSigns.length > 0
      ? { cerebralOedemaSigns: state.cerebralOedemaSigns }
      : {}),
    ...(state.odsRiskStatus ? { odsRiskStatus: state.odsRiskStatus } : {}),
    ...(state.symptomResponse ? { symptomResponse: state.symptomResponse } : {}),
    ...(state.euvolaemicUnderlyingCause
      ? { euvolaemicUnderlyingCause: state.euvolaemicUnderlyingCause }
      : {}),
    ...optionalNumericProperty("fourHourSodiumChange", state.fourHourSodiumChange),
    ...(state.urineResultsAvailability
      ? { urineResultsAvailable: state.urineResultsAvailability === "available" }
      : {}),
    ...optionalNumericProperty("serumOsmolality", state.serumOsmolality),
    ...optionalNumericProperty("urineOsmolality", state.urineOsmolality),
    ...optionalNumericProperty("urineSodium", state.urineSodium),
  };

  return evaluateHyponatraemiaConnectedAssessment(input);
}

function assessmentSteps(
  evaluation: HyponatraemiaConnectedAssessmentEvaluation | null,
  state: HyponatraemiaAssessmentViewState,
) {
  return [
    {
      description: state.sodium ? `${state.sodium} ${SODIUM_UNIT}` : "Latest result",
      id: "severity",
      label: "Severity",
    },
    { description: fluidStatusLabel(state.fluidStatus), id: "context", label: "Clinical context" },
    ...(evaluation?.emergencyRequired
      ? [{ description: "Selected branch", id: "emergency", label: "Emergency follow-up" }]
      : []),
    {
      description: evaluation?.classification.causePattern?.label ?? "Laboratory pattern",
      id: "classification",
      label: "Classification",
    },
    ...(evaluation?.euvolaemicCauseRequired
      ? [
          {
            description:
              EUVOLAEMIC_UNDERLYING_CAUSE_OPTIONS.find(
                (option) => option.value === state.euvolaemicUnderlyingCause,
              )?.label ?? "Underlying cause",
            id: "management",
            label: "Cause review",
          },
        ]
      : []),
    { description: "Deterministic output", id: "result", label: "Result" },
  ];
}

function stageIsComplete(
  stage: AssessmentStage,
  evaluation: HyponatraemiaConnectedAssessmentEvaluation | null,
): boolean {
  if (!evaluation) return false;
  switch (stage) {
    case "severity":
      return evaluation.completion.severity;
    case "context":
      return evaluation.completion.fluidStatus;
    case "emergency":
      return evaluation.completion.emergency;
    case "classification":
      return evaluation.completion.classification;
    case "management":
      return evaluation.completion.management;
    case "result":
      return true;
  }
}

function severitySummary(evaluation: HyponatraemiaConnectedAssessmentEvaluation): string {
  return evaluation.severity.kind === "classified"
    ? `${evaluation.severity.band.label}, sodium ${evaluation.severity.value} ${evaluation.severity.unit}`
    : "Hyponatraemia severity not classified";
}

function fluidStatusLabel(value: HyponatraemiaFluidStatus | null): string {
  return (
    HYPONATRAEMIA_FLUID_STATUS_OPTIONS.find((option) => option.value === value)?.label ??
    "Not established"
  );
}

function confirmedSignSummary(values: readonly CerebralOedemaSign[]): string {
  if (values.includes("none-confirmed")) return "No listed sign confirmed";
  const labels = values.map(
    (value) =>
      CEREBRAL_OEDEMA_SIGN_OPTIONS.find((option) => option.value === value)?.label ?? value,
  );
  return labels.length > 0 ? `${labels.join(", ")} confirmed` : "Signs awaiting confirmation";
}

function optionalNumber(value: string): number | undefined {
  return value.trim() === "" ? undefined : Number(value);
}

function optionalNumericProperty<
  Key extends "fourHourSodiumChange" | "serumOsmolality" | "urineOsmolality" | "urineSodium",
>(key: Key, value: string): Partial<Record<Key, number>> {
  const number = optionalNumber(value);
  return number === undefined ? {} : ({ [key]: number } as Partial<Record<Key, number>>);
}

function numericSnapshotError(
  snapshot: HyponatraemiaConnectedAssessmentEvaluation["emergency"],
  inputKey: string,
  value: string,
): string | undefined {
  if (value.trim() === "" || snapshot.status !== "blocked") return undefined;
  const issue = snapshot.issues.find((candidate) => candidate.field.includes(inputKey));
  if (!issue) return undefined;
  if (/decimal places/i.test(issue.message)) return "Enter no more than 1 decimal place.";
  if (/accepted range/i.test(issue.message)) return "Enter a value within the accepted range.";
  return "Enter a valid finite measurement.";
}

function errorProps(
  snapshot: HyponatraemiaConnectedAssessmentEvaluation["classification"]["snapshot"],
  inputKey: string,
  value: string,
): { error?: string } {
  const error = numericSnapshotError(snapshot, inputKey, value);
  return error ? { error } : {};
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
    case "use-separate-siadh-pathway":
      return "Separate SIADH pathway";
    case "fluid-restriction-water-intoxication":
      return "Fluid restriction";
    case "review-hypovolaemic-causes":
      return "Review hypovolaemic causes";
    case "use-hypovolaemic-isotonic-saline":
    case "add-hypovolaemic-isotonic-saline":
      return "0.9% sodium chloride";
    case "refer-senior-hypervolaemic-cause":
      return "Senior review and cause management";
    default:
      return "Pathway action";
  }
}

function capitalise(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
