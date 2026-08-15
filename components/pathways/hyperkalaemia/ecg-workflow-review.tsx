"use client";

import { Activity, CircleCheck, Gauge, HelpCircle, ShieldCheck } from "lucide-react";
import { useState } from "react";

import {
  GroupedSymptomSelection,
  NumericClinicalInput,
  ResultSection,
  ReviewStatusBadge,
  SafetyAlert,
} from "@/components/clinical";
import { Badge } from "@/components/ui/badge";
import {
  HYPERKALAEMIA_ECG_CHANGE_OPTIONS,
  POTASSIUM_UNIT,
  evaluateHyperkalaemiaEcgWorkflow,
  evaluateHyperkalaemiaSeverity,
  type HyperkalaemiaEcgChange,
  type HyperkalaemiaSeverity,
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
    description: "Stops the branch without inferring whether changes are present or absent.",
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

export function HyperkalaemiaEcgWorkflowReview() {
  const [potassiumInput, setPotassiumInput] = useState("6.0");
  const [ecgChanges, setEcgChanges] = useState<readonly HyperkalaemiaEcgChange[]>([]);
  const numericValue = potassiumInput.trim() === "" ? null : Number(potassiumInput);
  const severityEvaluation =
    numericValue === null ? null : evaluateHyperkalaemiaSeverity(numericValue);
  const ecgEvaluation =
    numericValue === null
      ? null
      : evaluateHyperkalaemiaEcgWorkflow({
          ...(ecgChanges.length === 0 ? {} : { ecgChanges }),
          potassium: numericValue,
        });
  const error = severityEvaluation?.kind === "invalid" ? severityEvaluation.message : undefined;
  const requiresEcg =
    severityEvaluation?.kind === "classified" && severityEvaluation.band.severity !== "mild";
  const ecgBranchId = ecgEvaluation?.selectedBranches.find(
    ({ nodeId }) => nodeId === "ecg-changes-question",
  )?.branchId;
  const confirmedChanges = HYPERKALAEMIA_ECG_CHANGE_OPTIONS.filter(({ value }) =>
    ecgChanges.includes(value),
  );

  function handlePotassiumChange(value: string) {
    setPotassiumInput(value);
    setEcgChanges([]);
  }

  function handleEcgChanges(nextValues: readonly string[]) {
    const typedValues = nextValues as readonly HyperkalaemiaEcgChange[];
    const selectedNone = typedValues.includes("none-confirmed");
    const selectedUnable = typedValues.includes("unable-to-determine");
    const noneWasSelected = ecgChanges.includes("none-confirmed");
    const unableWasSelected = ecgChanges.includes("unable-to-determine");

    if (selectedNone && !noneWasSelected) {
      setEcgChanges(["none-confirmed"]);
      return;
    }

    if (selectedUnable && !unableWasSelected) {
      setEcgChanges(["unable-to-determine"]);
      return;
    }

    if (typedValues.some((value) => listedChangeValues.has(value))) {
      setEcgChanges(
        typedValues.filter(
          (value) => value !== "none-confirmed" && value !== "unable-to-determine",
        ),
      );
      return;
    }

    setEcgChanges(typedValues);
  }

  return (
    <article className="border-border bg-surface rounded-lg border shadow-xs">
      <header className="border-border border-b p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-success-strong text-xs font-bold uppercase">
              Connected technical assessment
            </p>
            <h2 className="text-foreground mt-1 text-lg font-bold">Potassium and ECG review</h2>
          </div>
          <ReviewStatusBadge status="awaiting-clinical-review" />
        </div>
        <p className="text-muted mt-2 text-sm leading-6">
          Potassium severity determines whether the source-listed ECG question is required.
        </p>
      </header>

      <div className="p-5 sm:p-6">
        <NumericClinicalInput
          description="Use the latest confirmed serum potassium result. Changing it clears the downstream ECG selection."
          id="hyperkalaemia-ecg-potassium"
          label="Latest potassium result"
          min="0.01"
          onChange={(event) => handlePotassiumChange(event.target.value)}
          required
          step="0.01"
          unit={POTASSIUM_UNIT}
          value={potassiumInput}
          {...(error ? { error } : {})}
        />

        <div aria-live="polite" className="mt-6">
          {severityEvaluation === null ? (
            <div className="border-border bg-surface-subtle rounded-md border p-4" role="status">
              <p className="text-foreground text-sm font-semibold">Awaiting potassium result</p>
              <p className="text-muted mt-1 text-xs leading-5">
                The ECG stage remains hidden until a supported severity is available.
              </p>
            </div>
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
          <section
            aria-labelledby="ecg-initial-checks-title"
            className="border-border border-t pt-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3
                  className="text-foreground flex items-center gap-2 text-base font-semibold"
                  id="ecg-initial-checks-title"
                >
                  <ShieldCheck aria-hidden="true" className="text-primary size-5" />
                  Initial checks
                </h3>
                <p className="text-muted mt-1 text-xs leading-5">
                  Checks shown for the current supported severity.
                </p>
              </div>
              <Badge variant="review">Source-supported</Badge>
            </div>
            <ul className="border-border mt-4 divide-y border-y">
              {ecgEvaluation?.immediateActions.map((action) => (
                <li
                  className="grid min-h-12 grid-cols-[1.75rem_minmax(0,1fr)] items-start gap-3 py-3"
                  key={action.actionId}
                >
                  <span
                    aria-hidden="true"
                    className="bg-success-subtle text-success-strong flex size-7 items-center justify-center rounded-md"
                  >
                    {action.actionId === "perform-ecg-monitor-rhythm" ? (
                      <Activity className="size-4" />
                    ) : (
                      <CircleCheck className="size-4" />
                    )}
                  </span>
                  <span className="text-foreground text-sm leading-6">{action.instruction}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {ecgEvaluation?.warnings.map((warning) => (
          <div className="mt-6" key={warning.warningId}>
            <SafetyAlert level="critical" title="Urgent source safeguard">
              {warning.message}
            </SafetyAlert>
          </div>
        ))}

        {severityEvaluation?.kind === "classified" && !requiresEcg ? (
          <div className="mt-6">
            <SafetyAlert level="information" title="ECG selector not triggered">
              The implemented source threshold requests a 12-lead ECG and rhythm monitoring from 6.0
              mmol/L. No ECG branch is selected for this mild result.
            </SafetyAlert>
          </div>
        ) : null}

        {requiresEcg ? (
          <section
            aria-labelledby="ecg-selection-title"
            className="border-border mt-6 border-t pt-6"
          >
            <h3 className="sr-only" id="ecg-selection-title">
              ECG change selection
            </h3>
            <GroupedSymptomSelection
              description="Select every listed change that is clinically confirmed, or choose one explicit no-change or uncertainty state."
              groups={ecgSelectionGroups}
              legend="Source-listed ECG changes"
              name="hyperkalaemia-ecg-changes"
              onValuesChange={handleEcgChanges}
              values={ecgChanges}
            />

            <div aria-live="polite" className="border-border mt-6 border-t pt-5">
              {ecgChanges.length === 0 ? (
                <div
                  className="bg-surface-subtle flex items-start gap-3 rounded-md p-4"
                  role="status"
                >
                  <HelpCircle aria-hidden="true" className="text-primary mt-0.5 size-5 shrink-0" />
                  <div>
                    <p className="text-foreground text-sm font-semibold">Confirm ECG findings</p>
                    <p className="text-muted mt-1 text-xs leading-5">
                      An explicit answer is required before this branch can reach a review endpoint.
                    </p>
                  </div>
                </div>
              ) : null}

              {ecgBranchId === "listed-ecg-changes-confirmed" ? (
                <ResultSection
                  dividers={false}
                  headingAs="h3"
                  icon={Activity}
                  status="Escalation branch"
                  title="ECG changes confirmed"
                  tone="danger"
                >
                  <p>Confirmed: {confirmedChanges.map(({ label }) => label).join(", ")}.</p>
                  <ul className="mt-3 space-y-2">
                    {ecgEvaluation?.escalations.map((escalation) => (
                      <li className="flex items-start gap-2" key={escalation.escalationId}>
                        <CircleCheck
                          aria-hidden="true"
                          className="text-danger mt-1 size-4 shrink-0"
                        />
                        <span>{escalation.instruction}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-3 text-xs">
                    Medication and timed-treatment instructions remain outside this review stage.
                  </p>
                </ResultSection>
              ) : null}

              {ecgBranchId === "no-listed-ecg-changes" ? (
                <ResultSection
                  dividers={false}
                  headingAs="h3"
                  icon={CircleCheck}
                  status="No-change branch"
                  title="No listed ECG changes confirmed"
                  tone="success"
                >
                  <p>
                    The explicit no-change state is recorded without generating the deferred timed
                    treatment instructions.
                  </p>
                </ResultSection>
              ) : null}

              {ecgBranchId === "ecg-unable-to-determine" ? (
                <SafetyAlert level="warning" title="ECG assessment requires review">
                  No present-or-absent treatment branch has been selected from the available
                  information.
                </SafetyAlert>
              ) : null}
            </div>
          </section>
        ) : null}
      </div>
    </article>
  );
}
