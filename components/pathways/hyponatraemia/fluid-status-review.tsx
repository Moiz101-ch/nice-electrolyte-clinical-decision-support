"use client";

import { CircleHelp, ClipboardCheck, Droplets, Gauge, Scale, Waves } from "lucide-react";
import { useState } from "react";
import Link from "next/link";

import {
  GroupedSymptomSelection,
  MajorDecisionCards,
  PathwayProgress,
  ResultSection,
  ReviewStatusBadge,
  SafetyAlert,
} from "@/components/clinical";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  HYPONATRAEMIA_FLUID_STATUS_OPTIONS,
  evaluateHyponatraemiaFluidStatus,
  type CerebralOedemaSign,
  type HyponatraemiaFluidStatus,
} from "@/src/clinical/pathways/hyponatraemia";

const REVIEW_SODIUM = 129;

const fluidStatusIcons = {
  euvolaemic: Scale,
  hypervolaemic: Waves,
  hypovolaemic: Droplets,
  "unable-to-establish": CircleHelp,
} as const;

const symptomGroups = [
  {
    id: "general",
    label: "General signs",
    options: [
      { label: "Nausea", value: "nausea" },
      { label: "Vomiting", value: "vomiting" },
      { label: "Headache", value: "headache" },
    ],
  },
  {
    id: "neurological",
    label: "Neurological signs",
    options: [
      { label: "Low GCS", value: "low-gcs" },
      { label: "Ataxia", value: "ataxia" },
      { label: "Confusion", value: "confusion" },
    ],
  },
  {
    description: "Select this only when none of the six source-listed signs is confirmed.",
    id: "none",
    label: "No listed sign",
    options: [{ label: "None of the listed signs confirmed", value: "none-confirmed" }],
  },
] as const;

const progressSteps = [
  { description: "Hyponatraemia", id: "focus", label: "Assessment focus" },
  { description: "129 mmol/L", id: "sodium", label: "Sodium result" },
  { description: "Current assessment", id: "fluid-status", label: "Fluid status" },
  { description: "Adaptive question", id: "signs", label: "Listed signs" },
  { description: "Review state", id: "result", label: "Branch result" },
] as const;

export function HyponatraemiaFluidStatusReview() {
  const [fluidStatus, setFluidStatus] = useState<HyponatraemiaFluidStatus | null>(null);
  const [signs, setSigns] = useState<readonly CerebralOedemaSign[]>([]);
  const requiresSignCheck = fluidStatus === "hypovolaemic" || fluidStatus === "euvolaemic";
  const evaluation = evaluateHyponatraemiaFluidStatus({
    ...(fluidStatus ? { fluidStatus } : {}),
    ...(requiresSignCheck && signs.length > 0 ? { cerebralOedemaSigns: signs } : {}),
    sodium: REVIEW_SODIUM,
  });
  const currentStepId = getCurrentStepId(fluidStatus, requiresSignCheck, signs);

  function handleFluidStatusChange(value: string) {
    setFluidStatus(value as HyponatraemiaFluidStatus);
    setSigns([]);
  }

  function handleSignsChange(nextValues: readonly string[]) {
    const changedValue = nextValues.find((value) => !signs.includes(value as CerebralOedemaSign));

    if (changedValue === "none-confirmed") {
      setSigns(["none-confirmed"]);
      return;
    }

    setSigns(
      nextValues.filter((value) => value !== "none-confirmed") as readonly CerebralOedemaSign[],
    );
  }

  return (
    <div className="space-y-6">
      <PathwayProgress currentStepId={currentStepId} steps={progressSteps} />

      <article className="border-border bg-surface border-y">
        <header className="border-border border-b p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-primary text-xs font-bold uppercase">Inherited result</p>
              <h2 className="text-foreground mt-1 text-lg font-bold">Moderate hyponatraemia</h2>
              <p className="text-muted mt-1 text-sm">Sodium {REVIEW_SODIUM} mmol/L</p>
            </div>
            <ReviewStatusBadge status={evaluation.clinicalReviewStatus} />
          </div>
        </header>

        <div className="p-5 sm:p-6">
          <MajorDecisionCards
            description="Choose one clinically established volume state. The uncertain option stops the workflow for review."
            legend="Establish fluid status"
            name="fluid-status"
            onValueChange={handleFluidStatusChange}
            options={HYPONATRAEMIA_FLUID_STATUS_OPTIONS.map((option) => ({
              description: option.description,
              icon: fluidStatusIcons[option.value],
              label: option.label,
              value: option.value,
            }))}
            required
            value={fluidStatus ?? ""}
          />

          {requiresSignCheck ? (
            <div className="border-border mt-6 border-t pt-6">
              <GroupedSymptomSelection
                description="Select every sign that is clinically confirmed. The workflow will not infer unreported signs."
                groups={symptomGroups}
                legend="Signs of cerebral oedema present?"
                name="cerebral-oedema-signs"
                onValuesChange={handleSignsChange}
                values={signs}
              />
            </div>
          ) : null}

          <div aria-live="polite" className={requiresSignCheck ? "mt-2" : "mt-6"}>
            <BranchResult
              evaluation={evaluation}
              fluidStatus={fluidStatus}
              requiresSignCheck={requiresSignCheck}
              signs={signs}
            />
          </div>
        </div>
      </article>
    </div>
  );
}

interface BranchResultProps {
  evaluation: ReturnType<typeof evaluateHyponatraemiaFluidStatus>;
  fluidStatus: HyponatraemiaFluidStatus | null;
  requiresSignCheck: boolean;
  signs: readonly CerebralOedemaSign[];
}

function BranchResult({ evaluation, fluidStatus, requiresSignCheck, signs }: BranchResultProps) {
  if (evaluation.status === "blocked") {
    return (
      <SafetyAlert level="critical" title="Input blocked safely">
        The answers are missing, invalid or contradictory. No pathway branch or management output
        has been generated.
      </SafetyAlert>
    );
  }

  if (!fluidStatus) {
    return (
      <ResultSection icon={Gauge} status="Awaiting input" title="Select fluid status">
        The pathway is paused before fluid-status branching. No hidden default is applied.
      </ResultSection>
    );
  }

  if (requiresSignCheck && signs.length === 0) {
    return (
      <ResultSection icon={ClipboardCheck} status="Awaiting input" title="Confirm listed signs">
        The {fluidStatus} branch requires an explicit answer to the source-listed sign check.
      </ResultSection>
    );
  }

  if (evaluation.currentNode?.id === "emergency-management-pending") {
    return (
      <div>
        <SafetyAlert level="critical" title="Source emergency branch reached">
          One or more source-listed signs is confirmed. Continue only to the separate unapproved
          emergency-management review.
        </SafetyAlert>
        <div className="mt-3">
          <Button asChild size="sm" variant="danger">
            <Link href={{ pathname: "/review/hyponatraemia/emergency-management" }}>
              Review emergency management
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  if (evaluation.currentNode?.id === "fluid-status-review-required") {
    return (
      <SafetyAlert level="warning" title="Fluid status requires clinical review">
        No fluid-status branch was selected. No downstream classification or management output has
        been generated.
      </SafetyAlert>
    );
  }

  const branchLabel =
    fluidStatus === "hypervolaemic"
      ? "Hypervolaemic source endpoint reached"
      : `${toDisplayLabel(fluidStatus)} branch confirmed without a listed sign`;

  return (
    <div>
      <ResultSection
        icon={fluidStatus === "hypervolaemic" ? Waves : ClipboardCheck}
        status="Management deferred"
        title={branchLabel}
        tone="warning"
      >
        <p>{evaluation.stopReason}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge variant="review">Clinical review required</Badge>
          <Badge variant="neutral">No treatment output</Badge>
        </div>
      </ResultSection>
      <div className="mt-4">
        <Button asChild size="sm" variant="secondary">
          <Link href={{ pathname: "/review/hyponatraemia/classification" }}>
            Continue to urine and osmolality review
          </Link>
        </Button>
      </div>
    </div>
  );
}

function getCurrentStepId(
  fluidStatus: HyponatraemiaFluidStatus | null,
  requiresSignCheck: boolean,
  signs: readonly CerebralOedemaSign[],
): (typeof progressSteps)[number]["id"] {
  if (!fluidStatus) {
    return "fluid-status";
  }

  if (requiresSignCheck && signs.length === 0) {
    return "signs";
  }

  return "result";
}

function toDisplayLabel(value: HyponatraemiaFluidStatus): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
