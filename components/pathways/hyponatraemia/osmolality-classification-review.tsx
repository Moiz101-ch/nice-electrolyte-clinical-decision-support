"use client";

import {
  ArrowRight,
  Beaker,
  CircleHelp,
  CircleX,
  Droplets,
  Gauge,
  HeartPulse,
  ListChecks,
  TestTube2,
  Waves,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import {
  MajorDecisionCards,
  NumericClinicalInput,
  PathwayProgress,
  ResultSection,
  ReviewStatusBadge,
  SafetyAlert,
} from "@/components/clinical";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  HYPONATRAEMIA_FLUID_STATUS_OPTIONS,
  OSMOLALITY_UNIT,
  URINE_SODIUM_UNIT,
  evaluateHyponatraemiaOsmolalityClassification,
  type HyponatraemiaFluidStatus,
  type HyponatraemiaOsmolalityClassificationEvaluation,
} from "@/src/clinical/pathways/hyponatraemia";

type UrineResultAvailability = "available" | "not-available";

const availabilityOptions = [
  {
    description: "Continue to the structured serum and urine measurements.",
    icon: TestTube2,
    label: "Yes - results available",
    value: "available",
  },
  {
    description:
      "Continue without diagnostic classification; emergency assessment remains separate.",
    icon: CircleX,
    label: "No - not available",
    value: "not-available",
  },
] as const;

const fluidStatusIcons = {
  euvolaemic: Gauge,
  hypervolaemic: Waves,
  hypovolaemic: Droplets,
  "unable-to-establish": CircleHelp,
} as const;

const progressSteps = [
  { description: "Required first", id: "availability", label: "Result availability" },
  { description: "Classifies tonicity", id: "serum", label: "Serum osmolality" },
  { description: "For hypotonic only", id: "fluid", label: "Fluid status" },
  { description: "Branch-dependent", id: "urine", label: "Urine findings" },
  { description: "Compatible category", id: "result", label: "Classification" },
] as const;

export function HyponatraemiaOsmolalityClassificationReview() {
  const [availability, setAvailability] = useState<UrineResultAvailability | null>(null);
  const [serumOsmolality, setSerumOsmolality] = useState("");
  const [fluidStatus, setFluidStatus] = useState<HyponatraemiaFluidStatus | null>(null);
  const [urineOsmolality, setUrineOsmolality] = useState("");
  const [urineSodium, setUrineSodium] = useState("");
  const evaluation = evaluateHyponatraemiaOsmolalityClassification({
    ...(availability ? { urineResultsAvailable: availability === "available" } : {}),
    ...(fluidStatus ? { fluidStatus } : {}),
    ...numericValue("serumOsmolality", serumOsmolality),
    ...numericValue("urineOsmolality", urineOsmolality),
    ...numericValue("urineSodium", urineSodium),
  });
  const showSerumOsmolality = availability === "available";
  const showFluidStatus = evaluation.serumTonicity === "hypotonic";
  const showHypovolaemicUrineSodium =
    evaluation.serumTonicity === "hypotonic" && fluidStatus === "hypovolaemic";
  const showUrineOsmolality =
    fluidStatus === "euvolaemic" && evaluation.serumTonicity === "hypotonic";
  const showEuvolaemicUrineSodium =
    evaluation.serumTonicity === "hypotonic" &&
    fluidStatus === "euvolaemic" &&
    urineOsmolality.trim() !== "" &&
    Number(urineOsmolality) > 100;
  const serumOsmolalityError = numericError(evaluation, "serumOsmolality", serumOsmolality);
  const hypovolaemicUrineSodiumError = numericError(
    evaluation,
    "hypovolaemicUrineSodium",
    urineSodium,
  );
  const urineOsmolalityError = numericError(evaluation, "urineOsmolality", urineOsmolality);
  const euvolaemicUrineSodiumError = numericError(evaluation, "euvolaemicUrineSodium", urineSodium);

  function handleAvailabilityChange(value: string) {
    setAvailability(value as UrineResultAvailability);
    setSerumOsmolality("");
    setFluidStatus(null);
    setUrineOsmolality("");
    setUrineSodium("");
  }

  function handleSerumOsmolalityChange(value: string) {
    setSerumOsmolality(value);
    setFluidStatus(null);
    setUrineOsmolality("");
    setUrineSodium("");
  }

  function handleFluidStatusChange(value: string) {
    setFluidStatus(value as HyponatraemiaFluidStatus);
    setUrineOsmolality("");
    setUrineSodium("");
  }

  function handleUrineOsmolalityChange(value: string) {
    setUrineOsmolality(value);
    setUrineSodium("");
  }

  return (
    <div className="space-y-6">
      <PathwayProgress
        currentStepId={getCurrentStepId(evaluation, availability)}
        steps={progressSteps}
      />

      <article className="border-border bg-surface border-y">
        <header className="border-border flex flex-wrap items-start justify-between gap-3 border-b p-5 sm:p-6">
          <div>
            <p className="text-primary text-xs font-bold uppercase">Diagnostic classification</p>
            <h2 className="text-foreground mt-1 text-lg font-bold">Confirmed hyponatraemia</h2>
            <p className="text-muted mt-1 text-sm leading-6">
              Enter only confirmed laboratory results and clinically established fluid status.
            </p>
          </div>
          <ReviewStatusBadge status={evaluation.snapshot.clinicalReviewStatus} />
        </header>

        <div className="p-5 sm:p-6">
          <SafetyAlert level="warning" title="Required exclusion checks">
            Rule out hypothyroidism and secondary adrenal insufficiency in all cases.
          </SafetyAlert>

          <div className="mt-6">
            <MajorDecisionCards
              description="Unavailable urine results do not block the separate emergency assessment."
              legend="Are urine results available?"
              name="urine-results-available"
              onValueChange={handleAvailabilityChange}
              options={availabilityOptions}
              required
              value={availability ?? ""}
            />
          </div>

          {showSerumOsmolality ? (
            <div className="border-border mt-6 max-w-xl border-t pt-6">
              <NumericClinicalInput
                description="Used to classify the hyponatraemia as hypotonic, isotonic or hypertonic."
                id="serum-osmolality"
                label="Serum osmolality"
                min="0"
                onChange={(event) => handleSerumOsmolalityChange(event.target.value)}
                required
                step="0.1"
                unit={OSMOLALITY_UNIT}
                value={serumOsmolality}
                {...(serumOsmolalityError ? { error: serumOsmolalityError } : {})}
              />
            </div>
          ) : null}

          {showFluidStatus ? (
            <div className="border-border mt-6 border-t pt-6">
              <MajorDecisionCards
                description="This question is required only for hypotonic hyponatraemia."
                legend="Confirm fluid status"
                name="classification-fluid-status"
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
            </div>
          ) : null}

          {showHypovolaemicUrineSodium ? (
            <div className="border-border mt-6 max-w-xl border-t pt-6">
              <NumericClinicalInput
                description="Used to distinguish the diagram's non-renal and renal salt-loss categories."
                id="hypovolaemic-urine-sodium"
                label="Urine sodium"
                min="0"
                onChange={(event) => setUrineSodium(event.target.value)}
                required
                step="0.1"
                unit={URINE_SODIUM_UNIT}
                value={urineSodium}
                {...(hypovolaemicUrineSodiumError ? { error: hypovolaemicUrineSodiumError } : {})}
              />
            </div>
          ) : null}

          {showUrineOsmolality ? (
            <div className="border-border mt-6 max-w-xl border-t pt-6">
              <NumericClinicalInput
                description="Used first for the euvolaemic hypotonic branch."
                id="urine-osmolality"
                label="Urine osmolality"
                min="0"
                onChange={(event) => handleUrineOsmolalityChange(event.target.value)}
                required
                step="0.1"
                unit={OSMOLALITY_UNIT}
                value={urineOsmolality}
                {...(urineOsmolalityError ? { error: urineOsmolalityError } : {})}
              />
            </div>
          ) : null}

          {showEuvolaemicUrineSodium ? (
            <div className="border-border mt-6 max-w-xl border-t pt-6">
              <NumericClinicalInput
                description="Required only when urine osmolality is above 100 mOsm/kg."
                id="euvolaemic-urine-sodium"
                label="Urine sodium"
                min="0"
                onChange={(event) => setUrineSodium(event.target.value)}
                required
                step="0.1"
                unit={URINE_SODIUM_UNIT}
                value={urineSodium}
                {...(euvolaemicUrineSodiumError ? { error: euvolaemicUrineSodiumError } : {})}
              />
            </div>
          ) : null}

          <div aria-live="polite" className="mt-6">
            <ClassificationResult availability={availability} evaluation={evaluation} />
          </div>
        </div>
      </article>
    </div>
  );
}

interface ClassificationResultProps {
  availability: UrineResultAvailability | null;
  evaluation: HyponatraemiaOsmolalityClassificationEvaluation;
}

function ClassificationResult({ availability, evaluation }: ClassificationResultProps) {
  const { causePattern, serumTonicity, snapshot } = evaluation;

  if (snapshot.status === "blocked") {
    return (
      <SafetyAlert level="critical" title="Input requires correction">
        Correct the highlighted value before a classification branch can be selected.
      </SafetyAlert>
    );
  }

  if (!availability) {
    return (
      <ResultSection icon={TestTube2} status="Awaiting input" title="Confirm result availability">
        No diagnostic classification has been attempted.
      </ResultSection>
    );
  }

  if (availability === "not-available") {
    return (
      <div>
        <ResultSection
          icon={CircleHelp}
          status="Classification paused"
          title="Urine results unavailable"
          tone="warning"
        >
          The diagnostic classification cannot be completed without the required results. This does
          not prevent a separate emergency assessment.
        </ResultSection>
        <div className="mt-4">
          <Button asChild size="sm" variant="secondary">
            <Link href={{ pathname: "/review/hyponatraemia/emergency-management" }}>
              Open emergency review
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  if (causePattern) {
    return (
      <div className="space-y-5">
        <ResultSection
          description="Compatible category only - not a definitive diagnosis"
          icon={ListChecks}
          title={causePattern.label}
          tone="info"
          {...(serumTonicity ? { status: `${capitalise(serumTonicity)} pattern` } : {})}
        >
          <p>{causePattern.summary}</p>
          <h3 className="text-foreground mt-4 text-sm font-semibold">
            Associated cause categories
          </h3>
          <ul className="border-border mt-2 divide-y border-y">
            {causePattern.causes.map((cause) => (
              <li className="flex min-h-10 items-center gap-2 py-2" key={cause}>
                <HeartPulse aria-hidden="true" className="text-primary size-4 shrink-0" />
                {cause}
              </li>
            ))}
          </ul>
        </ResultSection>
        {causePattern.id === "siadh-compatible" ? (
          <SafetyAlert level="warning" title="SIADH management is not available">
            This pattern can be identified, but no dedicated SIADH management pathway is generated
            without an approved management source.
          </SafetyAlert>
        ) : null}
        <Badge variant="review">Pathway v{snapshot.pathway.version}</Badge>
      </div>
    );
  }

  if (isReviewStop(snapshot.currentNode?.id)) {
    return (
      <SafetyAlert level="warning" title="Classification requires clinical review">
        {snapshot.stopReason}
      </SafetyAlert>
    );
  }

  const currentTitle = snapshot.currentNode?.title ?? "classification input";

  return (
    <ResultSection
      icon={Beaker}
      status="Awaiting input"
      title={`Enter ${currentTitle.toLowerCase()}`}
    >
      {serumTonicity
        ? `${capitalise(serumTonicity)} hyponatraemia has been identified. Complete the active branch to obtain a compatible cause category.`
        : "No tonicity or cause category has been selected yet."}
    </ResultSection>
  );
}

function numericValue<Key extends "serumOsmolality" | "urineOsmolality" | "urineSodium">(
  key: Key,
  value: string,
): Partial<Record<Key, number>> {
  return value.trim() === "" ? {} : ({ [key]: Number(value) } as Partial<Record<Key, number>>);
}

function numericError(
  evaluation: HyponatraemiaOsmolalityClassificationEvaluation,
  inputKey: string,
  value: string,
): string | undefined {
  if (value.trim() === "" || evaluation.snapshot.status !== "blocked") return undefined;

  const issue = evaluation.snapshot.issues.find((candidate) => candidate.field.includes(inputKey));

  if (!issue) return undefined;
  if (/decimal places/i.test(issue.message)) return "Enter no more than 1 decimal place.";
  if (/accepted range/i.test(issue.message)) {
    return inputKey.toLowerCase().includes("sodium")
      ? "Enter a value of 0 or greater."
      : "Enter a value greater than 0.";
  }

  return "Enter a valid finite measurement.";
}

function getCurrentStepId(
  evaluation: HyponatraemiaOsmolalityClassificationEvaluation,
  availability: UrineResultAvailability | null,
): (typeof progressSteps)[number]["id"] {
  if (!availability) return "availability";
  if (availability === "not-available") return "result";
  if (!evaluation.snapshot.confirmedInputs.serumOsmolality) return "serum";
  if (
    evaluation.serumTonicity === "hypotonic" &&
    !evaluation.snapshot.confirmedInputs.fluidStatus
  ) {
    return "fluid";
  }
  if (evaluation.snapshot.status === "awaiting-input") return "urine";
  return "result";
}

function isReviewStop(nodeId: string | undefined): boolean {
  return Boolean(
    nodeId &&
    [
      "classification-fluid-status-review",
      "euvolaemic-urine-sodium-review",
      "serum-osmolality-boundary-review",
      "urine-osmolality-boundary-review",
      "urine-sodium-boundary-review",
    ].includes(nodeId),
  );
}

function capitalise(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
