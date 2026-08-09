import { Select } from "@/components/ui/select";
import { TextField } from "@/components/ui/text-field";
import { booleanAnswerOptions, type ContextQuestion } from "@/src/assessment/structured-assessment";
import { cn } from "@/lib/utils";

interface ContextQuestionFieldProps {
  error?: string | undefined;
  onChange: (id: string, value: string) => void;
  question: ContextQuestion;
  value: string;
}

export function ContextQuestionField({
  error,
  onChange,
  question,
  value,
}: ContextQuestionFieldProps) {
  const errorId = error ? `${question.id}-error` : undefined;
  const descriptionId = `${question.id}-description`;

  if (question.type === "boolean") {
    return (
      <fieldset
        aria-describedby={[descriptionId, errorId].filter(Boolean).join(" ")}
        className="border-border bg-surface-subtle rounded-md border p-4"
      >
        <legend className="text-foreground px-1 text-sm font-semibold">{question.label}</legend>
        <p className="text-muted mt-1 text-xs leading-5" id={descriptionId}>
          {question.description}
        </p>
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
          {booleanAnswerOptions.map((option) => (
            <label className="relative" key={option.value}>
              <input
                checked={value === option.value}
                className="peer sr-only"
                name={question.id}
                onChange={() => onChange(question.id, option.value)}
                type="radio"
                value={option.value}
              />
              <span
                className={cn(
                  "border-border-strong bg-surface text-muted-strong peer-focus-visible:outline-primary flex min-h-10 cursor-pointer items-center justify-center rounded-md border px-3 text-center text-xs font-semibold transition-colors peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2",
                  value === option.value && "border-primary bg-info-subtle text-primary",
                  error && "border-danger",
                )}
              >
                {option.label}
              </span>
            </label>
          ))}
        </div>
        {error ? (
          <p className="text-danger-strong mt-2 text-xs leading-5 font-medium" id={errorId}>
            {error}
          </p>
        ) : null}
      </fieldset>
    );
  }

  if (question.type === "number") {
    return (
      <TextField
        description={question.description}
        error={error}
        id={question.id}
        label={question.label}
        onChange={(event) => onChange(question.id, event.target.value)}
        required
        type="number"
        value={value}
        {...(question.inputMode === undefined ? {} : { inputMode: question.inputMode })}
        {...(question.max === undefined ? {} : { max: question.max })}
        {...(question.min === undefined ? {} : { min: question.min })}
        {...(question.step === undefined ? {} : { step: question.step })}
      />
    );
  }

  if (question.type === "text") {
    return (
      <TextField
        description={question.description}
        error={error}
        id={question.id}
        label={question.label}
        onChange={(event) => onChange(question.id, event.target.value)}
        placeholder={question.placeholder}
        required
        value={value}
      />
    );
  }

  return (
    <div className="space-y-1.5">
      <label className="text-foreground block text-sm font-semibold" htmlFor={question.id}>
        {question.label}
        <span aria-hidden="true" className="text-danger ml-1">
          *
        </span>
        <span className="sr-only"> (required)</span>
      </label>
      <Select
        aria-describedby={[descriptionId, errorId].filter(Boolean).join(" ")}
        aria-invalid={Boolean(error)}
        id={question.id}
        onChange={(event) => onChange(question.id, event.target.value)}
        required
        value={value}
      >
        <option value="">Select an answer</option>
        {question.options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
      <p className="text-muted text-xs leading-5" id={descriptionId}>
        {question.description}
      </p>
      {error ? (
        <p className="text-danger-strong text-xs leading-5 font-medium" id={errorId}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
