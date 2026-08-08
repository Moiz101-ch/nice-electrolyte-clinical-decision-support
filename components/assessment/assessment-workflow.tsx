"use client";

import { ArrowLeft, ArrowRight, Check, ClipboardCheck, LockKeyhole } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";

import {
  AbnormalityStep,
  AdaptiveQuestionsStep,
  ClinicalContextStep,
  DetailsStep,
  ReviewStep,
} from "@/components/assessment/assessment-steps";
import { AssessmentResult } from "@/components/results/assessment-result";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  buildValidatedAssessment,
  formatClinicalContext,
  formatCondition,
  formatElectrolyte,
  getVisibleContextQuestions,
  initialAssessmentFormState,
  validateAssessmentStep,
  type AssessmentFormErrors,
  type AssessmentFormState,
  type ClinicalContextOption,
  type ConditionId,
  type ElectrolyteId,
} from "@/src/assessment/structured-assessment";
import { createRuleEngine } from "@/src/rule-engine/engine";
import type { RuleEngineOutcome } from "@/src/rule-engine/types";

const ruleEngine = createRuleEngine();

const steps = [
  {
    description: "Choose the electrolyte and the confirmed abnormality or monitoring result.",
    label: "Abnormality",
    title: "Select the assessment focus",
  },
  {
    description: "Enter the adult age, latest mmol/L result and pregnancy status.",
    label: "Details",
    title: "Enter basic details",
  },
  {
    description: "Choose one exact context. This determines which questions appear next.",
    label: "Context",
    title: "Select the clinical context",
  },
  {
    description: "Confirm only the evidence required for the selected catalogue pathway.",
    label: "Questions",
    title: "Complete context-specific fields",
  },
  {
    description: "Review every field, edit anything that changed, then confirm the assessment.",
    label: "Confirm",
    title: "Review and confirm",
  },
] as const;

export function AssessmentWorkflow() {
  const [stepIndex, setStepIndex] = useState(0);
  const [furthestStep, setFurthestStep] = useState(0);
  const [state, setState] = useState<AssessmentFormState>(initialAssessmentFormState);
  const [errors, setErrors] = useState<AssessmentFormErrors>({});
  const [outcome, setOutcome] = useState<RuleEngineOutcome | null>(null);
  const resultRef = useRef<HTMLElement>(null);

  const currentStep = steps[stepIndex]!;
  const progress = ((stepIndex + 1) / steps.length) * 100;
  const visibleQuestions = useMemo(() => getVisibleContextQuestions(state), [state]);
  const answeredQuestions = visibleQuestions.filter(
    (question) => (state.contextAnswers[question.id] ?? "") !== "",
  ).length;

  useEffect(() => {
    if (outcome !== null) {
      resultRef.current?.focus();
    }
  }, [outcome]);

  function selectElectrolyte(electrolyte: ElectrolyteId) {
    updateState((current) => ({
      ...current,
      clinicalContext: "",
      condition: "",
      contextAnswers: {},
      electrolyte,
    }));
    setErrors({});
  }

  function selectCondition(condition: ConditionId) {
    updateState((current) => ({
      ...current,
      clinicalContext: "",
      condition,
      contextAnswers: {},
    }));
    clearErrors("condition", "clinicalContext");
  }

  function updateBasicField(
    field: "ageYears" | "measuredValue" | "pregnancyStatus",
    value: string,
  ) {
    updateState((current) => ({ ...current, [field]: value }));
    clearErrors(field);
  }

  function selectClinicalContext(clinicalContext: ClinicalContextOption["id"]) {
    updateState((current) => ({ ...current, clinicalContext, contextAnswers: {} }));
    clearErrors("clinicalContext");
  }

  function updateContextAnswer(id: string, value: string) {
    updateState((current) => {
      const contextAnswers = { ...current.contextAnswers, [id]: value };

      if (id === "symptomsStatus" && value !== "present") {
        delete contextAnswers.symptoms;
      }

      return { ...current, contextAnswers };
    });
    clearErrors(`contextAnswers.${id}`);
  }

  function setReviewed(reviewed: boolean) {
    setState((current) => ({ ...current, reviewed }));
    setOutcome(null);
    clearErrors("reviewed");
  }

  function updateState(updater: (current: AssessmentFormState) => AssessmentFormState) {
    setState((current) => ({ ...updater(current), reviewed: false }));
    setOutcome(null);
  }

  function clearErrors(...fields: string[]) {
    setErrors((current) => {
      const next = { ...current };

      for (const field of fields) {
        delete next[field];
      }

      return next;
    });
  }

  function editStep(nextStep: number) {
    setStepIndex(nextStep);
    setOutcome(null);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (stepIndex < steps.length - 1) {
      const stepErrors = validateAssessmentStep(state, stepIndex);

      if (Object.keys(stepErrors).length > 0) {
        setErrors(stepErrors);
        return;
      }

      const nextStep = stepIndex + 1;
      setErrors({});
      setStepIndex(nextStep);
      setFurthestStep((current) => Math.max(current, nextStep));
      return;
    }

    generatePreview();
  }

  function generatePreview() {
    const finalErrors = validateAssessmentStep(state, 4);

    if (!state.reviewed) {
      finalErrors.reviewed = "Confirm that the structured information has been reviewed.";
    }

    if (Object.keys(finalErrors).length > 0) {
      setErrors(finalErrors);
      return;
    }

    const built = buildValidatedAssessment(state);

    if (!built.success) {
      setErrors(built.errors);
      return;
    }

    setErrors({});
    setOutcome(ruleEngine.evaluate(built.data));
  }

  function editConfirmedAssessment() {
    setOutcome(null);
    setErrors({});
    setState((current) => ({ ...current, reviewed: false }));
    setStepIndex(steps.length - 1);
    setFurthestStep(steps.length - 1);
  }

  function startNewAssessment() {
    setOutcome(null);
    setErrors({});
    setState(initialAssessmentFormState);
    setStepIndex(0);
    setFurthestStep(0);
  }

  if (outcome !== null) {
    return (
      <AssessmentResult
        assessment={state}
        onEdit={editConfirmedAssessment}
        onStartNew={startNewAssessment}
        outcome={outcome}
        resultRef={resultRef}
      />
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-primary text-xs font-bold uppercase">New assessment</p>
          <h1 className="text-foreground mt-2 text-2xl font-bold sm:text-[1.75rem]">
            Adult electrolyte assessment
          </h1>
          <p className="text-muted mt-2 max-w-2xl text-sm leading-6">
            Enter confirmed, non-identifiable clinical information for deterministic NICE catalogue
            evaluation.
          </p>
        </div>
        <Badge className="w-fit" variant="info">
          <ClipboardCheck aria-hidden="true" className="size-3.5" />
          Structured assessment
        </Badge>
      </header>

      <section
        aria-label="Assessment progress"
        className="border-border bg-surface border-y py-4 sm:py-5"
      >
        <div className="flex items-center justify-between gap-3 px-1">
          <p className="text-muted-strong text-sm font-semibold">
            Step {stepIndex + 1} of {steps.length}
          </p>
          <p aria-live="polite" className="text-muted text-xs">
            {currentStep.title}
          </p>
        </div>
        <div
          aria-hidden="true"
          className="bg-surface-muted mt-3 h-1.5 overflow-hidden rounded-full"
        >
          <div
            className="bg-primary h-full rounded-full transition-[width]"
            style={{ width: `${progress}%` }}
          />
        </div>
        <ol className="mt-4 grid grid-cols-5 gap-1 sm:gap-2">
          {steps.map((step, index) => {
            const isCurrent = index === stepIndex;
            const isComplete = index < stepIndex || index < furthestStep;
            const isAvailable = index <= furthestStep;

            return (
              <li key={step.label}>
                <button
                  aria-current={isCurrent ? "step" : undefined}
                  aria-label={`Step ${index + 1}: ${step.title}`}
                  className={cn(
                    "flex min-h-12 w-full flex-col items-center gap-1 rounded-md px-1 py-1.5 text-center text-xs font-semibold transition-colors sm:flex-row sm:justify-center sm:gap-2",
                    isCurrent && "bg-info-subtle text-primary",
                    isComplete && !isCurrent && "text-success-strong hover:bg-success-subtle",
                    !isCurrent && !isComplete && "text-muted",
                  )}
                  disabled={!isAvailable}
                  onClick={() => setStepIndex(index)}
                  type="button"
                >
                  <span
                    className={cn(
                      "flex size-6 shrink-0 items-center justify-center rounded-full text-[11px]",
                      isCurrent && "bg-primary text-white",
                      isComplete && !isCurrent && "bg-success-subtle text-success-strong",
                      !isCurrent && !isComplete && "bg-surface-muted text-muted",
                    )}
                  >
                    {isComplete && !isCurrent ? (
                      <Check aria-hidden="true" className="size-3.5" />
                    ) : (
                      index + 1
                    )}
                  </span>
                  <span className="hidden sm:inline">{step.label}</span>
                </button>
              </li>
            );
          })}
        </ol>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="min-w-0 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{currentStep.title}</CardTitle>
              <CardDescription>{currentStep.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <form noValidate onSubmit={handleSubmit}>
                {stepIndex === 0 ? (
                  <AbnormalityStep
                    errors={errors}
                    onConditionChange={selectCondition}
                    onElectrolyteChange={selectElectrolyte}
                    state={state}
                  />
                ) : null}
                {stepIndex === 1 ? (
                  <DetailsStep errors={errors} onChange={updateBasicField} state={state} />
                ) : null}
                {stepIndex === 2 ? (
                  <ClinicalContextStep
                    errors={errors}
                    onChange={selectClinicalContext}
                    state={state}
                  />
                ) : null}
                {stepIndex === 3 ? (
                  <AdaptiveQuestionsStep
                    errors={errors}
                    onChange={updateContextAnswer}
                    state={state}
                  />
                ) : null}
                {stepIndex === 4 ? (
                  <ReviewStep
                    errors={errors}
                    onEdit={editStep}
                    onReviewedChange={setReviewed}
                    state={state}
                  />
                ) : null}

                <div className="border-border mt-8 flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
                  <Button
                    disabled={stepIndex === 0}
                    onClick={() => setStepIndex((current) => Math.max(current - 1, 0))}
                    type="button"
                    variant="secondary"
                  >
                    <ArrowLeft aria-hidden="true" />
                    Back
                  </Button>
                  {stepIndex < steps.length - 1 ? (
                    <Button type="submit">
                      Continue
                      <ArrowRight aria-hidden="true" />
                    </Button>
                  ) : (
                    <Button type="submit">
                      Generate result
                      <ArrowRight aria-hidden="true" />
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Assessment status</CardTitle>
              <CardDescription>Held in this browser tab only</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <DraftStatus label="Electrolyte" value={formatElectrolyte(state.electrolyte)} />
              <DraftStatus label="Selection" value={formatCondition(state.condition)} />
              <DraftStatus label="Context" value={formatClinicalContext(state.clinicalContext)} />
              <DraftStatus
                label="Context fields"
                value={
                  visibleQuestions.length === 0
                    ? "None required"
                    : `${answeredQuestions} of ${visibleQuestions.length} answered`
                }
              />
              <DraftStatus
                label="Confirmation"
                value={state.reviewed ? "Reviewed" : "Not yet confirmed"}
              />
            </CardContent>
          </Card>

          <Alert title="No result yet" variant="info">
            Complete and confirm the structured assessment before deterministic evaluation.
          </Alert>

          <div className="text-muted flex items-start gap-3 px-1 text-xs leading-5">
            <LockKeyhole aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            <p>Do not enter patient-identifiable information. Assessment data is not persisted.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}

function DraftStatus({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-muted text-xs">{label}</p>
      <p className="text-foreground mt-1 font-semibold break-words">{value}</p>
    </div>
  );
}
