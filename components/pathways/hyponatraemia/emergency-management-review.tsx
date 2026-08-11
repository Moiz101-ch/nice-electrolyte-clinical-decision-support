"use client";

import {
  Activity,
  CircleCheck,
  CircleHelp,
  CircleX,
  ClipboardList,
  Gauge,
  ShieldAlert,
  ShieldCheck,
  ShieldQuestion,
} from "lucide-react";
import { useState } from "react";

import {
  MajorDecisionCards,
  MonitoringTimeline,
  NumericClinicalInput,
  PathwayProgress,
  ResultSection,
  ReviewStatusBadge,
  SafetyAlert,
} from "@/components/clinical";
import { Badge } from "@/components/ui/badge";
import {
  HYPONATRAEMIA_SYMPTOM_RESPONSE_OPTIONS,
  ODS_RISK_OPTIONS,
  evaluateHyponatraemiaEmergencyManagement,
  type HyponatraemiaSymptomResponse,
  type OdsRiskStatus,
} from "@/src/clinical/pathways/hyponatraemia";

const REVIEW_SODIUM = 124;

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

const progressSteps = [
  { description: "Hyponatraemia", id: "focus", label: "Assessment focus" },
  { description: "Severe, symptomatic", id: "emergency", label: "Emergency branch" },
  { description: "Risk-dependent", id: "ods-risk", label: "ODS risk" },
  { description: "After initial treatment", id: "response", label: "Clinical response" },
  { description: "If symptoms persist", id: "four-hour", label: "Four-hour change" },
  { description: "Source endpoint", id: "result", label: "Branch result" },
] as const;

export function HyponatraemiaEmergencyManagementReview() {
  const [odsRiskStatus, setOdsRiskStatus] = useState<OdsRiskStatus | null>(null);
  const [symptomResponse, setSymptomResponse] = useState<HyponatraemiaSymptomResponse | null>(null);
  const [fourHourChange, setFourHourChange] = useState("");
  const requiresFourHourChange =
    symptomResponse === "not-improved" || symptomResponse === "unable-to-assess";
  const parsedFourHourChange = fourHourChange.trim() === "" ? null : Number(fourHourChange);
  const evaluation = evaluateHyponatraemiaEmergencyManagement({
    cerebralOedemaSigns: ["confusion"],
    fluidStatus: "euvolaemic",
    ...(parsedFourHourChange !== null ? { fourHourSodiumChange: parsedFourHourChange } : {}),
    ...(odsRiskStatus ? { odsRiskStatus } : {}),
    sodium: REVIEW_SODIUM,
    ...(symptomResponse ? { symptomResponse } : {}),
  });
  const initialActions = evaluation.immediateActions.filter(
    (action) => action.actionId !== "repeat-hypertonic-saline-dose",
  );
  const currentStepId = getCurrentStepId(
    odsRiskStatus,
    symptomResponse,
    requiresFourHourChange,
    fourHourChange,
  );
  const fourHourError = getFourHourError(evaluation, fourHourChange);

  function handleOdsRiskChange(value: string) {
    setOdsRiskStatus(value as OdsRiskStatus);
    setSymptomResponse(null);
    setFourHourChange("");
  }

  function handleSymptomResponseChange(value: string) {
    setSymptomResponse(value as HyponatraemiaSymptomResponse);
    setFourHourChange("");
  }

  return (
    <div className="space-y-6">
      <PathwayProgress currentStepId={currentStepId} steps={progressSteps} />

      <article className="border-border bg-surface border-y">
        <header className="border-border border-b p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-danger text-xs font-bold uppercase">Inherited emergency branch</p>
              <h2 className="text-foreground mt-1 text-lg font-bold">Severe hyponatraemia</h2>
              <p className="text-muted mt-1 text-sm leading-6">
                Sodium {REVIEW_SODIUM} mmol/L | Euvolaemic | Confusion confirmed
              </p>
            </div>
            <ReviewStatusBadge status={evaluation.clinicalReviewStatus} />
          </div>
        </header>

        <div className="p-5 sm:p-6">
          {evaluation.warnings.map((warning) => (
            <SafetyAlert
              key={warning.warningId}
              level={warning.severity === "critical" ? "critical" : "warning"}
              title="Maximum correction limit"
            >
              {warning.message}
            </SafetyAlert>
          ))}

          <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.65fr)]">
            <ActionList actions={initialActions} title="Immediate source actions" />
            {evaluation.information.map((item) => (
              <ResultSection
                description="Source-defined goal after initial treatment"
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

          <div className="border-border mt-6 border-t pt-6">
            <MajorDecisionCards
              description="The supplied source defines the enhanced monitoring schedule only when severe symptomatic hyponatraemia and high ODS risk are all present. It does not define the ODS risk criteria."
              legend="Is high risk of osmotic demyelination syndrome clinically confirmed?"
              name="ods-risk-status"
              onValueChange={handleOdsRiskChange}
              options={ODS_RISK_OPTIONS.map((option) => ({
                description: option.description,
                icon: odsRiskIcons[option.value],
                label: option.label,
                value: option.value,
              }))}
              required
              value={odsRiskStatus ?? ""}
            />
          </div>

          {evaluation.monitoring.length > 0 ? (
            <div className="border-border mt-6 border-t pt-6">
              <MonitoringTimeline
                items={evaluation.monitoring.map((item, index) => ({
                  description: item.instruction,
                  id: item.monitoringId,
                  label: index === 0 ? "Hourly sodium monitoring" : "Reduced-frequency monitoring",
                  status: index === 0 ? "current" : "upcoming",
                  timing:
                    index === 0 ? "Until sodium increases by 4-6 mmol/L" : "Then every 4-6 hours",
                }))}
                title="High-risk ODS monitoring"
              />
            </div>
          ) : null}

          {odsRiskStatus ? (
            <div className="border-border mt-6 border-t pt-6">
              <MajorDecisionCards
                description="Confirm the clinical response after the initial source-defined treatment."
                legend="Has there been symptomatic improvement?"
                name="symptom-response"
                onValueChange={handleSymptomResponseChange}
                options={HYPONATRAEMIA_SYMPTOM_RESPONSE_OPTIONS.map((option) => ({
                  description: option.description,
                  icon: responseIcons[option.value],
                  label: option.label,
                  value: option.value,
                }))}
                required
                value={symptomResponse ?? ""}
              />
            </div>
          ) : null}

          {requiresFourHourChange ? (
            <div className="border-border mt-6 max-w-xl border-t pt-6">
              <NumericClinicalInput
                description="Enter the change from the pre-treatment sodium result at 4 hours. The source states branches below 4 and above 5 mmol/L only."
                id="four-hour-sodium-change"
                label="Sodium change at 4 hours"
                onChange={(event) => setFourHourChange(event.target.value)}
                required
                step="0.1"
                unit="mmol/L"
                value={fourHourChange}
                {...(fourHourError ? { error: fourHourError } : {})}
              />
            </div>
          ) : null}

          <div aria-live="polite" className="mt-6">
            <EmergencyBranchResult
              evaluation={evaluation}
              fourHourChange={fourHourChange}
              odsRiskStatus={odsRiskStatus}
              requiresFourHourChange={requiresFourHourChange}
              symptomResponse={symptomResponse}
            />
          </div>
        </div>
      </article>
    </div>
  );
}

interface EmergencyBranchResultProps {
  evaluation: ReturnType<typeof evaluateHyponatraemiaEmergencyManagement>;
  fourHourChange: string;
  odsRiskStatus: OdsRiskStatus | null;
  requiresFourHourChange: boolean;
  symptomResponse: HyponatraemiaSymptomResponse | null;
}

function EmergencyBranchResult({
  evaluation,
  fourHourChange,
  odsRiskStatus,
  requiresFourHourChange,
  symptomResponse,
}: EmergencyBranchResultProps) {
  if (evaluation.status === "blocked") {
    return (
      <SafetyAlert level="critical" title="Follow-up input blocked safely">
        The supplied response is invalid. No repeat-dose or cause-management branch has been
        selected.
      </SafetyAlert>
    );
  }

  if (!odsRiskStatus) {
    return (
      <ResultSection icon={ShieldAlert} status="Awaiting input" title="Confirm ODS risk status">
        No monitoring assumption has been made.
      </ResultSection>
    );
  }

  if (!symptomResponse) {
    return (
      <ResultSection icon={Activity} status="Awaiting input" title="Confirm clinical response">
        The response branch remains paused after initial treatment.
      </ResultSection>
    );
  }

  if (requiresFourHourChange && fourHourChange.trim() === "") {
    return (
      <ResultSection icon={Gauge} status="Awaiting input" title="Enter the four-hour change">
        No repeat-dose or cause-management branch has been selected.
      </ResultSection>
    );
  }

  if (evaluation.currentNode?.id === "four-hour-response-review-required") {
    return (
      <SafetyAlert level="warning" title="No explicit source response branch">
        {evaluation.stopReason}
      </SafetyAlert>
    );
  }

  const repeatedDose = evaluation.immediateActions.some(
    (action) => action.actionId === "repeat-hypertonic-saline-dose",
  );
  const causeManagement = evaluation.nextActions.some(
    (action) => action.actionId === "diagnose-manage-cause-consultant-review",
  );

  return (
    <div className="space-y-5">
      <ResultSection
        icon={repeatedDose ? ClipboardList : CircleCheck}
        status="Clinical review required"
        title={repeatedDose ? "Repeat-dose branch reached" : "Initial response branch complete"}
        tone={repeatedDose ? "danger" : "success"}
      >
        {evaluation.stopReason}
      </ResultSection>
      {repeatedDose ? (
        <ActionList
          actions={evaluation.immediateActions.filter(
            (action) => action.actionId === "repeat-hypertonic-saline-dose",
          )}
          title="Immediate repeat action"
        />
      ) : null}
      {causeManagement ? (
        <ActionList actions={evaluation.nextActions} title="Next source action" />
      ) : null}
      <Badge variant="review">Pathway v{evaluation.pathway.version}</Badge>
    </div>
  );
}

interface ActionListProps {
  actions: ReturnType<typeof evaluateHyponatraemiaEmergencyManagement>["immediateActions"];
  title: string;
}

function getActionLabel(actionId: string) {
  switch (actionId) {
    case "obtain-pre-treatment-investigations":
      return "Pre-treatment investigations";
    case "administer-initial-hypertonic-saline":
      return "Hypertonic saline";
    case "repeat-hypertonic-saline-dose":
      return "Repeat treatment";
    case "diagnose-manage-cause-consultant-review":
      return "Cause management";
    default:
      return "Source action";
  }
}

function ActionList({ actions, title }: ActionListProps) {
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
                  {getActionLabel(action.actionId)}
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

function getCurrentStepId(
  odsRiskStatus: OdsRiskStatus | null,
  symptomResponse: HyponatraemiaSymptomResponse | null,
  requiresFourHourChange: boolean,
  fourHourChange: string,
): (typeof progressSteps)[number]["id"] {
  if (!odsRiskStatus) return "ods-risk";
  if (!symptomResponse) return "response";
  if (requiresFourHourChange && fourHourChange.trim() === "") return "four-hour";
  return "result";
}

function getFourHourError(
  evaluation: ReturnType<typeof evaluateHyponatraemiaEmergencyManagement>,
  fourHourChange: string,
): string | undefined {
  if (fourHourChange.trim() === "" || evaluation.status !== "blocked") {
    return undefined;
  }

  const message = evaluation.issues.find((issue) =>
    issue.field.includes("fourHourSodiumChange"),
  )?.message;

  return /decimal places/i.test(message ?? "")
    ? "Enter the sodium change with no more than 1 decimal place."
    : "Enter a finite sodium change in mmol/L.";
}
