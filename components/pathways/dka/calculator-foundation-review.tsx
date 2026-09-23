"use client";

import {
  Braces,
  Calculator,
  CircleCheck,
  FileKey2,
  ListChecks,
  ShieldCheck,
  Workflow,
} from "lucide-react";
import { useState, type KeyboardEvent } from "react";

import { SafetyAlert } from "@/components/clinical";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type {
  DkaCalculatorSession,
  DkaFoundationDisplayStep,
  DkaInputKindContract,
  DkaSourceCurrentnessGate,
  DkaSourceStepNumber,
} from "@/src/clinical/pathways/dka";

interface DkaCalculatorFoundationReviewProps {
  gate: DkaSourceCurrentnessGate;
  initialSession: DkaCalculatorSession;
  inputKindContracts: readonly DkaInputKindContract[];
  resultFields: readonly string[];
  steps: readonly DkaFoundationDisplayStep[];
}

export function DkaCalculatorFoundationReview({
  gate,
  initialSession,
  inputKindContracts,
  resultFields,
  steps,
}: DkaCalculatorFoundationReviewProps) {
  const [selectedStepNumber, setSelectedStepNumber] = useState(initialSession.currentStepNumber);
  const selectedStep = steps.find((step) => step.stepNumber === selectedStepNumber)!;
  const selectedRules = selectedStep.rules;
  const blockedRequirements = gate.requirements.filter(({ status }) => status === "blocked").length;

  function selectStep(stepNumber: DkaSourceStepNumber) {
    if (steps.some((step) => step.stepNumber === stepNumber)) {
      setSelectedStepNumber(stepNumber);
    }
  }

  function handleStepKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    stepNumber: DkaSourceStepNumber,
  ) {
    const currentIndex = steps.findIndex((step) => step.stepNumber === stepNumber);
    const lastIndex = steps.length - 1;
    const nextIndex =
      event.key === "ArrowRight"
        ? (currentIndex + 1) % steps.length
        : event.key === "ArrowLeft"
          ? (currentIndex - 1 + steps.length) % steps.length
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? lastIndex
              : null;

    if (nextIndex === null) {
      return;
    }

    event.preventDefault();
    const nextStepNumber = steps[nextIndex]!.stepNumber;
    selectStep(nextStepNumber);
    document.getElementById(`dka-foundation-step-${nextStepNumber}`)?.focus();
  }

  return (
    <div className="space-y-9">
      <SafetyAlert level="critical" title="Clinical execution remains locked">
        The calculator foundation is available for technical review only. The source-currentness
        gate has {blockedRequirements} unresolved requirements, so no patient values can be entered
        and no DKA calculation or treatment output can be generated.
      </SafetyAlert>

      <section aria-labelledby="dka-foundation-navigation" className="border-border border-y py-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Workflow aria-hidden="true" className="text-primary size-5" />
              <h2 className="text-foreground text-lg font-bold" id="dka-foundation-navigation">
                Source-stage navigation
              </h2>
            </div>
            <p className="text-muted mt-2 max-w-3xl text-sm leading-6">
              Select a mapped stage to inspect its future implementation boundary. Selection does
              not begin an assessment or mark earlier stages complete.
            </p>
          </div>
          <Badge variant="danger">Execution blocked</Badge>
        </div>

        <div
          aria-label="DKA source stages"
          className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-5"
          role="tablist"
        >
          {steps.map((step) => {
            const selected = step.stepNumber === selectedStepNumber;

            return (
              <button
                aria-controls="dka-foundation-step-panel"
                aria-selected={selected}
                className={cn(
                  "border-border bg-surface text-muted-strong hover:border-primary hover:text-foreground flex min-h-11 items-center justify-center rounded-md border px-3 py-2 text-sm font-semibold transition-colors",
                  selected && "border-primary bg-info-subtle text-info-strong",
                )}
                id={`dka-foundation-step-${step.stepNumber}`}
                key={step.stepNumber}
                onKeyDown={(event) => handleStepKeyDown(event, step.stepNumber)}
                onClick={() => selectStep(step.stepNumber)}
                role="tab"
                tabIndex={selected ? 0 : -1}
                type="button"
              >
                Step {step.stepNumber}
              </button>
            );
          })}
        </div>

        <div
          aria-labelledby={`dka-foundation-step-${selectedStep.stepNumber}`}
          className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.65fr)]"
          id="dka-foundation-step-panel"
          role="tabpanel"
        >
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="info">Step {selectedStep.stepNumber}</Badge>
              <Badge variant="neutral">Mapped, not implemented</Badge>
            </div>
            <h3 className="text-foreground mt-3 text-base font-bold">{selectedStep.title}</h3>
            <ul className="text-muted mt-3 space-y-2 text-sm leading-6">
              {selectedStep.mappedElements.map((element) => (
                <li className="flex items-start gap-2" key={element}>
                  <CircleCheck aria-hidden="true" className="text-primary mt-1 size-4 shrink-0" />
                  {element}
                </li>
              ))}
            </ul>
          </div>

          <div className="border-border border-l pl-5">
            <p className="text-muted text-xs font-semibold uppercase">Mapped rule targets</p>
            {selectedRules.length > 0 ? (
              <ul className="mt-3 space-y-2">
                {selectedRules.map((rule) => (
                  <li className="text-foreground text-sm leading-5" key={rule.title}>
                    {rule.title}
                    {rule.reviewStatus === "blocked-by-source-conflict" ? (
                      <Badge className="ml-2" variant="danger">
                        Conflict
                      </Badge>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted mt-3 text-sm leading-6">
                No deterministic rule is assigned to this stage yet.
              </p>
            )}
          </div>
        </div>
      </section>

      <section aria-labelledby="dka-typed-input-contract">
        <div className="flex items-center gap-2">
          <Braces aria-hidden="true" className="text-primary size-5" />
          <h2 className="text-foreground text-lg font-bold" id="dka-typed-input-contract">
            Typed input contract
          </h2>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Badge variant="neutral">Declared clinical inputs: 0</Badge>
          <Badge variant="success">No patient data collected</Badge>
        </div>
        <ul className="mt-5 grid auto-rows-fr gap-3 sm:grid-cols-2">
          {inputKindContracts.map((contract) => (
            <li
              className="border-border bg-surface h-full rounded-lg border p-4 shadow-xs"
              key={contract.kind}
            >
              <p className="text-foreground text-sm font-semibold">
                {inputKindLabel(contract.kind)}
              </p>
              <p className="text-muted mt-1 text-xs leading-5">{contract.validation}</p>
            </li>
          ))}
        </ul>
      </section>

      <section
        aria-label="Calculation and result contracts"
        className="border-border grid gap-8 border-y py-7 lg:grid-cols-2"
      >
        <div>
          <div className="flex items-center gap-2">
            <Calculator aria-hidden="true" className="text-primary size-5" />
            <h2 className="text-foreground text-base font-bold">
              Deterministic calculation engine
            </h2>
          </div>
          <ul className="text-muted-strong mt-4 space-y-2 text-sm leading-6">
            <ContractItem text="Executes only declared arithmetic operations" />
            <ContractItem text="Rejects missing, malformed, out-of-range or wrong-unit inputs" />
            <ContractItem text="Applies declared precision, rounding and source limits" />
            <ContractItem text="Returns immutable output for identical confirmed inputs" />
          </ul>
        </div>

        <div>
          <div className="flex items-center gap-2">
            <ListChecks aria-hidden="true" className="text-primary size-5" />
            <h2 className="text-foreground text-base font-bold">Transparent result contract</h2>
          </div>
          <ul className="text-muted-strong mt-4 grid gap-2 text-sm leading-6 sm:grid-cols-2">
            {resultFields.map((field) => (
              <ContractItem key={field} text={field} />
            ))}
          </ul>
        </div>
      </section>

      <section aria-labelledby="dka-source-mapping-contract">
        <div className="flex items-start gap-3">
          <span className="bg-info-subtle text-primary flex size-10 shrink-0 items-center justify-center rounded-md">
            <FileKey2 aria-hidden="true" className="size-5" />
          </span>
          <div>
            <h2 className="text-foreground text-base font-bold" id="dka-source-mapping-contract">
              Source mapping contract
            </h2>
            <p className="text-muted-strong mt-2 max-w-4xl text-sm leading-6">
              Every future input, branch, calculation, warning and result must retain an internal
              mapping to the registered DKA source. Internal source identifiers and document page
              labels remain available to governance tests but are not rendered in the clinical UI.
            </p>
          </div>
        </div>
      </section>

      <SafetyAlert level="information" title="Foundation boundary">
        This route verifies architecture only. Source-derived Steps 1–4 are available in a separate
        synthetic technical preview; clinical execution remains blocked.
      </SafetyAlert>

      <div className="text-muted flex items-start gap-3 text-xs leading-5">
        <ShieldCheck aria-hidden="true" className="text-success mt-0.5 size-4 shrink-0" />
        Session version {initialSession.version}; current source stage {selectedStepNumber}; stored
        inputs {Object.keys(initialSession.inputs).length}; calculated results{" "}
        {initialSession.calculations.length}.
      </div>
    </div>
  );
}

function ContractItem({ text }: { text: string }) {
  return (
    <li className="flex items-start gap-2">
      <CircleCheck aria-hidden="true" className="text-success mt-1 size-4 shrink-0" />
      <span>{text}</span>
    </li>
  );
}

function inputKindLabel(kind: DkaInputKindContract["kind"]): string {
  const labels = {
    boolean: "Explicit confirmation",
    "multi-select": "Multiple selection",
    numeric: "Numeric measurement",
    "single-choice": "Single selection",
  } satisfies Record<DkaInputKindContract["kind"], string>;

  return labels[kind];
}
