"use client";

import { ArrowLeft, ArrowRight, RotateCcw } from "lucide-react";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  emptyJbdsDkaInput,
  evaluateJbdsDka,
  type JbdsDkaInput,
  type JbdsStageId,
  type JbdsStageStatus,
} from "@/src/clinical/pathways/dka/jbds-calculator";

type NumericKey = {
  [K in keyof JbdsDkaInput]: JbdsDkaInput[K] extends number | null ? K : never;
}[keyof JbdsDkaInput];
type BooleanKey = {
  [K in keyof JbdsDkaInput]: JbdsDkaInput[K] extends boolean | null ? K : never;
}[keyof JbdsDkaInput];
type Field = {
  key: keyof JbdsDkaInput;
  label: string;
  unit?: string;
  kind: "number" | "answer";
  note?: string;
};

const fields: Record<JbdsStageId, readonly Field[]> = {
  diagnosis: [
    { key: "ageYears", label: "Age", unit: "years", kind: "number" },
    {
      key: "adultTeamFor16To17",
      label: "For age 16-17, managed by adult diabetes team?",
      kind: "answer",
    },
    { key: "knownDiabetes", label: "Known diabetes?", kind: "answer" },
    { key: "diagnosticGlucose", label: "Presenting glucose", unit: "mmol/L", kind: "number" },
    { key: "diagnosticKetones", label: "Presenting blood ketones", unit: "mmol/L", kind: "number" },
    { key: "urineKetonesPlus", label: "Urine ketones", unit: "number of +", kind: "number" },
    { key: "diagnosticPh", label: "Presenting venous pH", kind: "number" },
    {
      key: "diagnosticBicarbonate",
      label: "Presenting bicarbonate",
      unit: "mmol/L",
      kind: "number",
    },
  ],
  risk: [
    { key: "pregnant", label: "Pregnant?", kind: "answer" },
    { key: "heartFailure", label: "Heart failure?", kind: "answer" },
    { key: "kidneyFailure", label: "Renal failure?", kind: "answer" },
    { key: "elderly", label: "Clinically elderly?", kind: "answer" },
    { key: "pulse", label: "Pulse", unit: "/min", kind: "number" },
    { key: "gcs", label: "GCS", kind: "number" },
    { key: "oxygenSaturation", label: "Oxygen saturation", unit: "%", kind: "number" },
    { key: "normalOxygenBaseline", label: "Normally normal oxygen saturation?", kind: "answer" },
    { key: "anionGap", label: "Anion gap", unit: "mmol/L", kind: "number" },
  ],
  fluids: [
    { key: "ivAccess", label: "IV access obtained?", kind: "answer" },
    { key: "systolicBp", label: "Initial systolic BP", unit: "mmHg", kind: "number" },
    {
      key: "repeatSystolicBp",
      label: "BP after initial bolus (if needed)",
      unit: "mmHg",
      kind: "number",
    },
    { key: "potassium", label: "Serum potassium", unit: "mmol/L", kind: "number" },
  ],
  insulin: [
    { key: "weightKg", label: "Current or estimated weight", unit: "kg", kind: "number" },
    { key: "fluidsStarted", label: "IV fluids started?", kind: "answer" },
    { key: "currentGlucose", label: "Latest glucose", unit: "mmol/L", kind: "number" },
    { key: "takesLongActingInsulin", label: "Usually takes long-acting insulin?", kind: "answer" },
  ],
  monitoring: [
    { key: "intervalMinutes", label: "Time between measurements", unit: "minutes", kind: "number" },
    { key: "previousKetones", label: "Previous blood ketones", unit: "mmol/L", kind: "number" },
    { key: "currentKetones", label: "Latest blood ketones", unit: "mmol/L", kind: "number" },
    {
      key: "previousBicarbonate",
      label: "Previous bicarbonate (if no ketones)",
      unit: "mmol/L",
      kind: "number",
    },
    {
      key: "currentBicarbonate",
      label: "Latest bicarbonate (if no ketones)",
      unit: "mmol/L",
      kind: "number",
    },
    {
      key: "previousGlucose",
      label: "Previous glucose (if no ketones)",
      unit: "mmol/L",
      kind: "number",
    },
    { key: "currentGlucose", label: "Latest glucose", unit: "mmol/L", kind: "number" },
    { key: "urineOutputMlPerHour", label: "Urine output", unit: "mL/hour", kind: "number" },
  ],
  transition: [
    { key: "currentKetones", label: "Latest blood ketones", unit: "mmol/L", kind: "number" },
    { key: "currentPh", label: "Latest venous pH", kind: "number" },
    { key: "eatingAndDrinking", label: "Ready and able to eat/drink?", kind: "answer" },
    {
      key: "scPlanConfirmed",
      label: "Specialist/local subcutaneous plan confirmed?",
      kind: "answer",
    },
    {
      key: "scShortActingGiven",
      label: "Meal-associated short-acting dose given?",
      kind: "answer",
    },
    {
      key: "overlapMinutes",
      label: "IV insulin continued after SC dose",
      unit: "minutes",
      kind: "number",
    },
  ],
};

const standardCase: JbdsDkaInput = {
  ...emptyJbdsDkaInput,
  ageYears: 42,
  adultTeamFor16To17: null,
  knownDiabetes: true,
  diagnosticGlucose: 24,
  diagnosticKetones: 5.4,
  urineKetonesPlus: null,
  diagnosticPh: 7.16,
  diagnosticBicarbonate: 11,
  weightKg: 70,
  systolicBp: 112,
  potassium: 4.5,
  ivAccess: true,
  fluidsStarted: true,
  pregnant: false,
  heartFailure: false,
  kidneyFailure: false,
  elderly: false,
  pulse: 88,
  gcs: 15,
  oxygenSaturation: 98,
  normalOxygenBaseline: true,
  anionGap: 15,
  takesLongActingInsulin: true,
  currentGlucose: 12,
  previousGlucose: 16,
  currentKetones: 0.4,
  previousKetones: 1.2,
  currentPh: 7.36,
  currentBicarbonate: 17,
  previousBicarbonate: 13,
  intervalMinutes: 60,
  eatingAndDrinking: true,
  scPlanConfirmed: true,
  scShortActingGiven: true,
  overlapMinutes: 45,
};

const cases = [
  { id: "blank", label: "Enter values manually", input: emptyJbdsDkaInput },
  { id: "standard", label: "Confirmed DKA through transition", input: standardCase },
  {
    id: "low-bp",
    label: "Low BP and low potassium",
    input: {
      ...standardCase,
      systolicBp: 82,
      repeatSystolicBp: 86,
      potassium: 3.1,
      currentKetones: 2.1,
      currentPh: 7.25,
      eatingAndDrinking: false,
      scPlanConfirmed: false,
      scShortActingGiven: false,
      overlapMinutes: null,
    },
  },
  {
    id: "euglycaemic",
    label: "Known diabetes with lower glucose",
    input: {
      ...standardCase,
      diagnosticGlucose: 9.5,
      currentGlucose: 8.1,
      previousGlucose: 9.4,
      previousKetones: 4.2,
      currentKetones: 3.9,
      currentPh: 7.24,
      eatingAndDrinking: false,
      scPlanConfirmed: false,
      scShortActingGiven: false,
      overlapMinutes: null,
    },
  },
] as const;

export function JbdsCalculatorReview() {
  const [caseId, setCaseId] = useState<string>("blank");
  const [input, setInput] = useState<JbdsDkaInput>(() => structuredClone(emptyJbdsDkaInput));
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [index, setIndex] = useState(0);
  const evaluation = useMemo(() => evaluateJbdsDka(input), [input]);
  const current = evaluation.stages[index]!;

  function selectCase(id: string) {
    const selected = cases.find((item) => item.id === id);
    if (!selected) return;
    setCaseId(id);
    setInput(structuredClone(selected.input));
    setDrafts({});
    setIndex(0);
  }

  function updateNumber(key: NumericKey, raw: string) {
    setDrafts((previous) => ({ ...previous, [key]: raw }));
    setInput((previous) => ({ ...previous, [key]: raw === "" ? null : Number(raw) }));
  }

  function updateAnswer(key: BooleanKey, value: string) {
    setInput((previous) => ({ ...previous, [key]: value === "unknown" ? null : value === "yes" }));
  }

  return (
    <div className="space-y-6">
      <div className="border-border flex flex-wrap items-end gap-3 border-b pb-5">
        <div className="min-w-56 flex-1">
          <label className="text-foreground mb-1.5 block text-sm font-semibold" htmlFor="jbds-case">
            Test scenario
          </label>
          <Select
            id="jbds-case"
            onChange={(event) => selectCase(event.target.value)}
            value={caseId}
          >
            {cases.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </Select>
        </div>
        <Button
          aria-label="Clear inputs"
          onClick={() => selectCase("blank")}
          size="icon"
          title="Clear inputs"
          type="button"
          variant="secondary"
        >
          <RotateCcw aria-hidden="true" />
        </Button>
      </div>

      <nav aria-label="DKA calculator stages">
        <Select
          aria-label="Calculator stage"
          className="md:hidden"
          onChange={(event) => setIndex(Number(event.target.value))}
          value={index}
        >
          {evaluation.stages.map((item, position) => (
            <option key={item.id} value={position}>
              {position + 1}. {item.title}
            </option>
          ))}
        </Select>
        <div className="hidden gap-2 md:grid md:grid-cols-3 xl:grid-cols-6">
          {evaluation.stages.map((item, position) => (
            <button
              aria-current={index === position ? "step" : undefined}
              className={cn(
                "motion-stage-tab border-border bg-surface hover:border-primary flex min-h-24 min-w-0 flex-col gap-2 rounded-md border p-3 text-left",
                index === position && "border-primary bg-info-subtle",
              )}
              key={item.id}
              onClick={() => setIndex(position)}
              type="button"
            >
              <span className="text-muted text-xs font-semibold">Stage {position + 1}</span>
              <span className="text-foreground text-sm font-semibold break-words">
                {item.title}
              </span>
              <span className="text-muted mt-auto text-xs">{statusLabel(item.status)}</span>
            </button>
          ))}
        </div>
      </nav>

      <div className="motion-result-enter grid min-w-0 gap-8 lg:grid-cols-2" key={current.id}>
        <section aria-labelledby="jbds-input-title" className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="info">Stage {index + 1}</Badge>
            <h2 className="text-foreground text-lg font-bold" id="jbds-input-title">
              {current.title}
            </h2>
          </div>
          <div className="mt-5 grid gap-x-5 gap-y-4 sm:grid-cols-2">
            {fields[current.id].map((field) => {
              const id = `jbds-${field.key}`;
              const issue = evaluation.issues.find((item) => item.path === field.key);
              const value = input[field.key];
              return (
                <div className="min-w-0" key={field.key}>
                  <label
                    className="text-foreground mb-1.5 block text-sm font-semibold"
                    htmlFor={id}
                  >
                    {field.label}
                    {field.unit ? ` (${field.unit})` : ""}
                  </label>
                  {field.kind === "number" ? (
                    <Input
                      aria-invalid={Boolean(issue)}
                      id={id}
                      inputMode="decimal"
                      onChange={(event) =>
                        updateNumber(field.key as NumericKey, event.target.value)
                      }
                      step="any"
                      type="number"
                      value={drafts[field.key] ?? (value === null ? "" : String(value))}
                    />
                  ) : (
                    <Select
                      id={id}
                      onChange={(event) =>
                        updateAnswer(field.key as BooleanKey, event.target.value)
                      }
                      value={value === null ? "unknown" : value ? "yes" : "no"}
                    >
                      <option value="unknown">Not confirmed</option>
                      <option value="yes">Yes</option>
                      <option value="no">No</option>
                    </Select>
                  )}
                  {issue ? (
                    <p className="text-danger mt-1 text-xs" role="status">
                      {issue.message}
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>

        <section
          aria-labelledby="jbds-result-title"
          aria-live="polite"
          className="border-border min-w-0 border-t pt-6 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-8"
        >
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-foreground text-lg font-bold" id="jbds-result-title">
              Calculated result
            </h2>
            <Badge variant={statusVariant(current.status)}>{statusLabel(current.status)}</Badge>
          </div>
          <p className="text-foreground mt-5 font-semibold">{current.summary}</p>
          {current.details.length > 0 ? (
            <ul className="border-border mt-4 divide-y border-y text-sm leading-6">
              {current.details.map((detail) => (
                <li className="text-muted-strong py-3" key={detail}>
                  {detail}
                </li>
              ))}
            </ul>
          ) : null}
          {current.metrics?.length ? (
            <dl className="border-border mt-5 grid gap-4 border-t pt-4 text-sm sm:grid-cols-2">
              {current.metrics.map(([label, value]) => (
                <div key={label}>
                  <dt className="text-muted text-xs font-semibold">{label}</dt>
                  <dd className="text-foreground mt-1 font-medium break-words">{value}</dd>
                </div>
              ))}
            </dl>
          ) : null}
        </section>
      </div>

      <div className="border-border flex justify-between border-t pt-5">
        <Button
          disabled={index === 0}
          onClick={() => setIndex((currentIndex) => currentIndex - 1)}
          type="button"
          variant="secondary"
        >
          <ArrowLeft aria-hidden="true" /> Back
        </Button>
        <Button
          disabled={index === evaluation.stages.length - 1}
          onClick={() => setIndex((currentIndex) => currentIndex + 1)}
          type="button"
        >
          Next <ArrowRight aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}

function statusLabel(status: JbdsStageStatus): string {
  return {
    complete: "Complete",
    "needs-input": "Awaiting input",
    review: "Review needed",
    "not-applicable": "Not reached",
  }[status];
}

function statusVariant(status: JbdsStageStatus): "success" | "info" | "danger" | "neutral" {
  return {
    complete: "success",
    "needs-input": "info",
    review: "danger",
    "not-applicable": "neutral",
  }[status] as "success" | "info" | "danger" | "neutral";
}
