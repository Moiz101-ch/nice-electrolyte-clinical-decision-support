import { Pencil, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";

import { ContextQuestionField } from "@/components/assessment/context-question-field";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { TextField } from "@/components/ui/text-field";
import { cn } from "@/lib/utils";
import {
  electrolyteOptions,
  formatAnswer,
  formatClinicalContext,
  formatCondition,
  formatElectrolyte,
  getClinicalContextOptions,
  getConditionOptions,
  getVisibleContextQuestions,
  pregnancyStatusOptions,
  type AssessmentFormErrors,
  type AssessmentFormState,
  type ClinicalContextOption,
  type ConditionId,
  type ElectrolyteId,
} from "@/src/assessment/structured-assessment";

interface AbnormalityStepProps {
  errors: AssessmentFormErrors;
  onConditionChange: (condition: ConditionId) => void;
  onElectrolyteChange: (electrolyte: ElectrolyteId) => void;
  state: AssessmentFormState;
}

export function AbnormalityStep({
  errors,
  onConditionChange,
  onElectrolyteChange,
  state,
}: AbnormalityStepProps) {
  const conditionOptions = getConditionOptions(state.electrolyte);

  return (
    <div className="space-y-7">
      <fieldset aria-describedby={errors.electrolyte ? "electrolyte-error" : undefined}>
        <legend className="text-foreground text-sm font-semibold">Electrolyte</legend>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {electrolyteOptions.map((electrolyte) => {
            const selected = state.electrolyte === electrolyte.id;

            return (
              <button
                aria-pressed={selected}
                className={cn(
                  "border-border bg-surface hover:border-primary flex min-h-20 items-center gap-3 rounded-md border p-4 text-left transition-colors",
                  selected && "border-primary bg-info-subtle shadow-xs",
                )}
                key={electrolyte.id}
                onClick={() => onElectrolyteChange(electrolyte.id)}
                type="button"
              >
                <span className="bg-surface-muted text-primary-hover flex size-10 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                  {electrolyte.symbol}
                </span>
                <span className="min-w-0">
                  <span className="text-foreground block text-sm font-semibold">
                    {electrolyte.label}
                  </span>
                  <span className="text-muted mt-1 block text-xs leading-5">
                    {electrolyte.coverage}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
        <FieldError error={errors.electrolyte} id="electrolyte-error" />
      </fieldset>

      {state.electrolyte !== "" ? (
        <fieldset aria-describedby={errors.condition ? "condition-error" : undefined}>
          <legend className="text-foreground text-sm font-semibold">
            Abnormality or monitoring result
          </legend>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {conditionOptions.map((option) => {
              const selected = state.condition === option.value;

              return (
                <button
                  aria-pressed={selected}
                  className={cn(
                    "border-border bg-surface hover:border-primary min-h-12 rounded-md border px-4 py-3 text-left text-sm font-semibold transition-colors",
                    selected && "border-primary bg-info-subtle text-primary",
                  )}
                  key={option.value}
                  onClick={() => onConditionChange(option.value as ConditionId)}
                  type="button"
                >
                  {option.label}
                </button>
              );
            })}
          </div>
          <FieldError error={errors.condition} id="condition-error" />
        </fieldset>
      ) : null}

      {state.electrolyte === "magnesium" ? (
        <Alert title="No condition-specific NICE management pathway" variant="warning">
          Magnesium can be assessed and confirmed, but the deterministic result will use the
          unsupported safety rule without treatment instructions.
        </Alert>
      ) : null}
    </div>
  );
}

interface DetailsStepProps {
  errors: AssessmentFormErrors;
  onChange: (field: "ageYears" | "measuredValue" | "pregnancyStatus", value: string) => void;
  state: AssessmentFormState;
}

export function DetailsStep({ errors, onChange, state }: DetailsStepProps) {
  const electrolyte = formatElectrolyte(state.electrolyte).toLowerCase();
  const pregnancyDescriptionId = "pregnancy-status-description";
  const pregnancyErrorId = errors.pregnancyStatus ? "pregnancy-status-error" : undefined;

  return (
    <div className="space-y-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          description="Enter age in completed years. This prototype supports adults aged 16 and over."
          error={errors.ageYears}
          id="age-years"
          inputMode="numeric"
          label="Age (years)"
          max="130"
          min="16"
          onChange={(event) => onChange("ageYears", event.target.value)}
          required
          step="1"
          type="number"
          value={state.ageYears}
        />
        <TextField
          description="Use the latest confirmed local result. The rule engine accepts mmol/L only."
          error={errors.measuredValue}
          id="measured-value"
          inputMode="decimal"
          label={`Latest ${electrolyte} result (mmol/L)`}
          min="0"
          onChange={(event) => onChange("measuredValue", event.target.value)}
          required
          step="any"
          type="number"
          value={state.measuredValue}
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-foreground block text-sm font-semibold" htmlFor="pregnancy-status">
          Pregnancy status
          <span aria-hidden="true" className="text-danger ml-1">
            *
          </span>
          <span className="sr-only"> (required)</span>
        </label>
        <Select
          aria-describedby={[pregnancyDescriptionId, pregnancyErrorId].filter(Boolean).join(" ")}
          aria-invalid={Boolean(errors.pregnancyStatus)}
          id="pregnancy-status"
          onChange={(event) => onChange("pregnancyStatus", event.target.value)}
          required
          value={state.pregnancyStatus}
        >
          <option value="">Select pregnancy status</option>
          {pregnancyStatusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
        <p className="text-muted text-xs leading-5" id={pregnancyDescriptionId}>
          Pregnancy is outside the adult-general MVP and will be routed to a blocked safety result.
        </p>
        <FieldError error={errors.pregnancyStatus} id={pregnancyErrorId} />
      </div>

      {state.pregnancyStatus === "pregnant" ? (
        <Alert title="Outside this prototype's scope" variant="warning">
          This assessment can be reviewed, but the engine will not apply adult-general management
          rules. Use a pregnancy-specific pathway or specialist review.
        </Alert>
      ) : null}
    </div>
  );
}

interface ClinicalContextStepProps {
  errors: AssessmentFormErrors;
  onChange: (clinicalContext: ClinicalContextOption["id"]) => void;
  state: AssessmentFormState;
}

export function ClinicalContextStep({ errors, onChange, state }: ClinicalContextStepProps) {
  const options = getClinicalContextOptions(state.electrolyte, state.condition);

  return (
    <fieldset aria-describedby={errors.clinicalContext ? "clinical-context-error" : undefined}>
      <legend className="text-foreground text-sm font-semibold">Confirmed clinical context</legend>
      <div className="mt-3 grid gap-3">
        {options.map((option) => {
          const selected = state.clinicalContext === option.id;

          return (
            <button
              aria-pressed={selected}
              className={cn(
                "border-border bg-surface hover:border-primary flex min-h-16 items-start gap-3 rounded-md border p-4 text-left transition-colors",
                selected && "border-primary bg-info-subtle shadow-xs",
              )}
              key={option.id}
              onClick={() => onChange(option.id)}
              type="button"
            >
              <span
                aria-hidden="true"
                className={cn(
                  "border-border-strong mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border",
                  selected && "border-primary bg-primary",
                )}
              >
                {selected ? <span className="size-1.5 rounded-full bg-white" /> : null}
              </span>
              <span>
                <span className="text-foreground block text-sm font-semibold">{option.label}</span>
                <span className="text-muted mt-1 block text-xs leading-5">
                  {option.description}
                </span>
              </span>
            </button>
          );
        })}
      </div>
      <FieldError error={errors.clinicalContext} id="clinical-context-error" />

      {state.clinicalContext === "general-adult-presentation" ? (
        <Alert className="mt-5" title="Unsupported NICE-only context" variant="warning">
          The assessment can continue, but no condition-specific management instruction will be
          generated from the current catalogue.
        </Alert>
      ) : null}
    </fieldset>
  );
}

interface AdaptiveQuestionsStepProps {
  errors: AssessmentFormErrors;
  onChange: (id: string, value: string) => void;
  state: AssessmentFormState;
}

export function AdaptiveQuestionsStep({ errors, onChange, state }: AdaptiveQuestionsStepProps) {
  const questions = getVisibleContextQuestions(state);

  if (questions.length === 0) {
    return (
      <Alert title="No additional context fields" variant="info">
        The confirmed general context does not have a condition-specific evaluator. Continue to
        review the structured assessment.
      </Alert>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-muted text-sm leading-6">
          Answer from confirmed information only. Choose not confirmed when evidence is unavailable.
        </p>
        <Badge variant="info">{questions.length} fields</Badge>
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        {questions.map((question) => (
          <ContextQuestionField
            error={errors[`contextAnswers.${question.id}`]}
            key={question.id}
            onChange={onChange}
            question={question}
            value={state.contextAnswers[question.id] ?? ""}
          />
        ))}
      </div>
    </div>
  );
}

interface ReviewStepProps {
  errors: AssessmentFormErrors;
  onEdit: (stepIndex: number) => void;
  onReviewedChange: (reviewed: boolean) => void;
  state: AssessmentFormState;
}

export function ReviewStep({ errors, onEdit, onReviewedChange, state }: ReviewStepProps) {
  const questions = getVisibleContextQuestions(state);
  const pregnancyStatus =
    pregnancyStatusOptions.find((option) => option.value === state.pregnancyStatus)?.label ??
    "Not selected";

  return (
    <div className="space-y-5">
      <ReviewSection editLabel="Edit abnormality" onEdit={() => onEdit(0)} title="Abnormality">
        <SummaryRow label="Electrolyte" value={formatElectrolyte(state.electrolyte)} />
        <SummaryRow label="Selection" value={formatCondition(state.condition)} />
      </ReviewSection>

      <ReviewSection editLabel="Edit basic details" onEdit={() => onEdit(1)} title="Basic details">
        <SummaryRow label="Age" value={`${state.ageYears} years`} />
        <SummaryRow label="Latest result" value={`${state.measuredValue} mmol/L`} />
        <SummaryRow label="Pregnancy status" value={pregnancyStatus} />
      </ReviewSection>

      <ReviewSection
        editLabel="Edit clinical context"
        onEdit={() => onEdit(2)}
        title="Clinical context"
      >
        <SummaryRow label="Context" value={formatClinicalContext(state.clinicalContext)} />
      </ReviewSection>

      <ReviewSection
        editLabel="Edit context answers"
        onEdit={() => onEdit(3)}
        title="Context details"
      >
        {questions.length === 0 ? (
          <SummaryRow label="Additional fields" value="None for the selected context" />
        ) : (
          questions.map((question) => (
            <SummaryRow
              key={question.id}
              label={question.label}
              value={formatAnswer(question, state)}
            />
          ))
        )}
      </ReviewSection>

      <label
        className={cn(
          "border-border bg-surface-subtle flex cursor-pointer items-start gap-3 rounded-md border p-4",
          errors.reviewed && "border-danger bg-danger-subtle",
        )}
      >
        <input
          aria-describedby={errors.reviewed ? "reviewed-error" : "reviewed-description"}
          checked={state.reviewed}
          className="accent-primary mt-0.5 size-4 shrink-0"
          onChange={(event) => onReviewedChange(event.target.checked)}
          type="checkbox"
        />
        <span>
          <span className="text-foreground flex items-center gap-2 text-sm font-semibold">
            <ShieldCheck aria-hidden="true" className="text-success size-4" />I confirm this
            structured information has been reviewed
          </span>
          <span className="text-muted mt-1 block text-sm leading-6" id="reviewed-description">
            The deterministic engine will use only these confirmed fields. No information is stored.
          </span>
          <FieldError error={errors.reviewed} id="reviewed-error" />
        </span>
      </label>
    </div>
  );
}

function ReviewSection({
  children,
  editLabel,
  onEdit,
  title,
}: {
  children: ReactNode;
  editLabel: string;
  onEdit: () => void;
  title: string;
}) {
  return (
    <section className="border-border overflow-hidden rounded-md border">
      <div className="border-border bg-surface-subtle flex min-h-12 items-center justify-between gap-3 border-b px-4 py-2">
        <h3 className="text-foreground text-sm font-semibold">{title}</h3>
        <Button aria-label={editLabel} onClick={onEdit} size="sm" type="button" variant="ghost">
          <Pencil aria-hidden="true" />
          Edit
        </Button>
      </div>
      <dl className="divide-border divide-y">{children}</dl>
    </section>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 px-4 py-3 sm:grid-cols-[minmax(10rem,0.8fr)_minmax(0,1.2fr)] sm:gap-4">
      <dt className="text-muted text-sm">{label}</dt>
      <dd className="text-foreground min-w-0 text-sm font-semibold break-words">{value}</dd>
    </div>
  );
}

function FieldError({ error, id }: { error?: string | undefined; id?: string | undefined }) {
  return error ? (
    <p className="text-danger-strong mt-2 text-xs leading-5 font-medium" id={id}>
      {error}
    </p>
  ) : null;
}
