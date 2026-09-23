"use client";

import { ArrowLeft, ArrowRight, Calculator, CircleAlert, RotateCcw } from "lucide-react";
import { useMemo, useState } from "react";

import { SafetyAlert } from "@/components/clinical";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  evaluateDkaConnectedCalculator,
  type DkaSourceStepNumber,
  type DkaStepsFiveToTenInput,
} from "@/src/clinical/pathways/dka";

import { dkaCalculatorFields, type DkaCalculatorField } from "./connected-calculator-fields";

interface DkaConnectedCase {
  readonly id: string;
  readonly input: DkaStepsFiveToTenInput;
  readonly label: string;
}

interface DkaConnectedCalculatorReviewProps {
  cases: readonly DkaConnectedCase[];
  steps: readonly { readonly stepNumber: DkaSourceStepNumber; readonly title: string }[];
}

export function DkaConnectedCalculatorReview({ cases, steps }: DkaConnectedCalculatorReviewProps) {
  const [caseId, setCaseId] = useState(cases[0]!.id);
  const [input, setInput] = useState<DkaStepsFiveToTenInput>(() =>
    structuredClone(cases[0]!.input),
  );
  const [stepNumber, setStepNumber] = useState<DkaSourceStepNumber>(1);
  const [edited, setEdited] = useState(false);
  const [numericDrafts, setNumericDrafts] = useState<Record<string, string>>({});
  const evaluation = useMemo(() => evaluateDkaConnectedCalculator(input), [input]);
  const firstStages = evaluation.initial?.stages ?? [];
  const laterStages = evaluation.later?.stages ?? [];
  const allStages = [...firstStages, ...laterStages];
  const selectedStage = allStages[stepNumber - 1];
  const fields = dkaCalculatorFields[stepNumber - 1]!;
  const selectedCase = cases.find((item) => item.id === caseId)!;

  function selectCase(id: string) {
    const next = cases.find((item) => item.id === id);
    if (!next) return;
    setCaseId(id);
    setInput(structuredClone(next.input));
    setStepNumber(1);
    setEdited(false);
    setNumericDrafts({});
  }

  function updateField(field: DkaCalculatorField, value: unknown, raw?: string) {
    if (raw !== undefined) {
      setNumericDrafts((current) => ({ ...current, [field.path.join(".")]: raw }));
    }
    setInput((current) => {
      const next = structuredClone(current);
      let target: Record<string, unknown> = next as unknown as Record<string, unknown>;
      for (const key of field.path.slice(0, -1)) {
        target = target[key] as Record<string, unknown>;
      }
      target[field.path.at(-1)!] = value;
      return next;
    });
    setEdited(true);
  }

  return (
    <div className="space-y-7">
      <SafetyAlert level="critical" title="Technical test calculator - not for patient care">
        Synthetic values only. The source conflict blocks resolution, conversion and prescriptions.
      </SafetyAlert>

      <section aria-labelledby="dka-test-case-title" className="border-border border-b pb-6">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="text-foreground text-sm font-bold" id="dka-test-case-title">
              Test scenario
            </h2>
            <Select
              aria-label="Test scenario"
              className="mt-2"
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
            aria-label="Reset case"
            onClick={() => selectCase(selectedCase.id)}
            size="icon"
            title="Reset case"
            type="button"
            variant="secondary"
          >
            <RotateCcw aria-hidden="true" />
          </Button>
          {edited ? <Badge variant="info">Edited test case</Badge> : null}
        </div>
      </section>

      <nav aria-label="DKA calculator stages">
        <Select
          aria-label="Calculator stage"
          className="sm:hidden"
          onChange={(event) => setStepNumber(Number(event.target.value) as DkaSourceStepNumber)}
          value={stepNumber}
        >
          {steps.map((step) => (
            <option key={step.stepNumber} value={step.stepNumber}>
              Step {step.stepNumber}: {step.title}
            </option>
          ))}
        </Select>
        <div className="hidden gap-2 sm:grid sm:grid-cols-5">
          {steps.map((step) => {
            const status = allStages[step.stepNumber - 1]?.status ?? "not-reached";
            const current = stepNumber === step.stepNumber;
            return (
              <button
                aria-current={current ? "step" : undefined}
                className={cn(
                  "border-border bg-surface hover:border-primary flex min-h-20 min-w-0 flex-col justify-between gap-1 rounded-md border p-3 text-left",
                  current && "border-primary bg-info-subtle",
                )}
                key={step.stepNumber}
                onClick={() => setStepNumber(step.stepNumber)}
                type="button"
              >
                <span className="text-muted text-xs font-semibold">Step {step.stepNumber}</span>
                <span className="text-foreground text-sm font-semibold break-words">
                  {step.title}
                </span>
                <span className="text-muted text-xs">{statusLabel(status)}</span>
              </button>
            );
          })}
        </div>
      </nav>

      <div className="grid min-w-0 gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <section aria-labelledby="dka-current-input-title" className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="info">Step {stepNumber}</Badge>
            <h2 className="text-foreground text-lg font-bold" id="dka-current-input-title">
              {steps[stepNumber - 1]!.title}
            </h2>
          </div>
          <div className="mt-5 grid gap-x-5 gap-y-4 sm:grid-cols-2">
            {fields.map((field) => {
              const path = field.path.join(".");
              const issue = evaluation.inputIssues.find((item) => item.path === path);
              return (
                <FieldInput
                  field={field}
                  issue={issue?.message}
                  key={path}
                  onChange={(value, raw) => updateField(field, value, raw)}
                  value={
                    field.kind === "number"
                      ? (numericDrafts[path] ?? getValue(input, field.path))
                      : getValue(input, field.path)
                  }
                />
              );
            })}
          </div>
        </section>

        <section
          aria-labelledby="dka-current-result-title"
          aria-live="polite"
          className="border-border min-w-0 border-t pt-6 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-8"
        >
          <div className="flex items-center gap-2">
            <Calculator aria-hidden="true" className="text-primary size-5" />
            <h2 className="text-foreground text-lg font-bold" id="dka-current-result-title">
              Technical result
            </h2>
          </div>
          {selectedStage ? (
            <div className="mt-5 space-y-5">
              <div>
                <Badge variant={statusVariant(selectedStage.status)}>
                  {statusLabel(selectedStage.status)}
                </Badge>
                <p className="text-foreground mt-3 font-semibold">{selectedStage.summary}</p>
              </div>
              {selectedStage.findings.length > 0 ? (
                <ul className="border-border divide-y border-y text-sm leading-6">
                  {selectedStage.findings.map((finding) => (
                    <li className="text-muted-strong flex items-start gap-2 py-2.5" key={finding}>
                      <CircleAlert
                        aria-hidden="true"
                        className="text-primary mt-1 size-4 shrink-0"
                      />
                      <span>{finding}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted text-sm">This stage has not been reached.</p>
              )}
              {stepNumber === 4 && evaluation.initial?.calculation ? (
                <CalculationAudit
                  items={[
                    ["Entered weight", `${input.initial.weightKg} kg`],
                    ["Formula", evaluation.initial.calculation.formula],
                    [
                      "Before source maximum",
                      `${evaluation.initial.calculation.output.unlimitedValue} units/hour`,
                    ],
                    [
                      "Technical value",
                      `${evaluation.initial.calculation.output.value} units/hour`,
                    ],
                    [
                      "Source maximum",
                      `${evaluation.initial.calculation.sourceDefinedLimit?.value} units/hour`,
                    ],
                  ]}
                />
              ) : null}
              {stepNumber === 7 && evaluation.later?.oliguriaThreshold ? (
                <>
                  {evaluation.consistencyWarnings.map((warning) => (
                    <SafetyAlert key={warning} level="warning" title="Recorded rate differs">
                      {warning}
                    </SafetyAlert>
                  ))}
                  <CalculationAudit
                    items={[
                      ["Weight", `${input.initial.weightKg} kg`],
                      ["Formula", evaluation.later.oliguriaThreshold.formula],
                      [
                        "Oliguria threshold",
                        `${evaluation.later.oliguriaThreshold.output.value} mL/hour`,
                      ],
                    ]}
                  />
                </>
              ) : null}
              {stepNumber === 8 && evaluation.later?.responseTrend ? (
                <CalculationAudit
                  items={[
                    [
                      "Ketone fall",
                      `${evaluation.later.responseTrend.ketoneFallMmolLPerHour} mmol/L/hour`,
                    ],
                    [
                      "Bicarbonate rise",
                      `${evaluation.later.responseTrend.bicarbonateRiseMmolLPerHour} mmol/L/hour`,
                    ],
                    [
                      "Glucose fall",
                      `${evaluation.later.responseTrend.glucoseFallMmolLPerHour} mmol/L/hour`,
                    ],
                    [
                      "Source targets",
                      evaluation.later.responseTrend.sourceTargetsMet ? "Met" : "Not met",
                    ],
                  ]}
                />
              ) : null}
              {stepNumber === 10 && evaluation.later?.transitionReview ? (
                <div className="border-border border-t pt-4 text-sm">
                  <p className="text-foreground font-semibold">Isolated source mapping only</p>
                  <p className="text-muted mt-1">{evaluation.later.transitionReview.summary}</p>
                  <ul className="text-muted-strong mt-3 list-disc space-y-2 pl-5">
                    {evaluation.later.transitionReview.findings.map((finding) => (
                      <li key={finding}>{finding}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              <Badge variant="danger">Input invalid</Badge>
              <p className="text-muted text-sm leading-6">
                Correct the invalid measurements before this stage can be evaluated.
              </p>
            </div>
          )}
          {evaluation.inputIssues.length > 0 ? (
            <p className="text-danger mt-5 text-sm" role="status">
              {evaluation.inputIssues.length} input{" "}
              {evaluation.inputIssues.length === 1 ? "value needs" : "values need"} correction.
            </p>
          ) : null}
        </section>
      </div>

      <div className="border-border flex items-center justify-between gap-3 border-t pt-5">
        <Button
          disabled={stepNumber === 1}
          onClick={() => setStepNumber((current) => (current - 1) as DkaSourceStepNumber)}
          type="button"
          variant="secondary"
        >
          <ArrowLeft aria-hidden="true" />
          Back
        </Button>
        <Button
          disabled={stepNumber === 10}
          onClick={() => setStepNumber((current) => (current + 1) as DkaSourceStepNumber)}
          type="button"
        >
          Next
          <ArrowRight aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}

function FieldInput({
  field,
  issue,
  onChange,
  value,
}: {
  field: DkaCalculatorField;
  issue?: string | undefined;
  onChange: (value: unknown, raw?: string) => void;
  value: unknown;
}) {
  const id = `dka-${field.path.join("-")}`;
  if (field.kind === "boolean") {
    return (
      <label
        className="border-border flex min-h-11 items-center gap-3 border-b py-2 text-sm"
        htmlFor={id}
      >
        <input
          checked={value === true}
          className="accent-primary size-4 shrink-0"
          id={id}
          onChange={(event) => onChange(event.target.checked)}
          type="checkbox"
        />
        <span className="text-foreground">{field.label}</span>
      </label>
    );
  }

  return (
    <div className="min-w-0">
      <label className="text-foreground mb-1.5 block text-sm font-semibold" htmlFor={id}>
        {field.label}
        {field.unit ? ` (${field.unit})` : ""}
      </label>
      {field.kind === "number" ? (
        <Input
          aria-describedby={issue ? `${id}-error` : undefined}
          aria-invalid={Boolean(issue)}
          id={id}
          inputMode="decimal"
          max={field.max}
          min={field.min}
          onChange={(event) => {
            const raw = event.target.value;
            const parsed = raw === "" ? null : Number(raw);
            onChange(parsed !== null && !Number.isFinite(parsed) ? null : parsed, raw);
          }}
          step={field.step ?? "any"}
          type="number"
          value={typeof value === "number" || typeof value === "string" ? value : ""}
        />
      ) : (
        <Select
          id={id}
          onChange={(event) =>
            onChange(
              field.kind === "regimen"
                ? event.target.value || null
                : event.target.value === "unknown"
                  ? null
                  : event.target.value === "yes",
            )
          }
          value={
            field.kind === "regimen"
              ? String(value ?? "")
              : value === null
                ? "unknown"
                : value
                  ? "yes"
                  : "no"
          }
        >
          {field.kind === "regimen" ? (
            <>
              <option value="">Not established</option>
              <option value="new">New insulin use</option>
              <option value="basal-bolus">Basal-bolus</option>
              <option value="twice-daily-mixed">Twice-daily mixed</option>
              <option value="pump">Pump</option>
            </>
          ) : (
            <>
              <option value="unknown">Unable to confirm</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </>
          )}
        </Select>
      )}
      {issue ? (
        <p className="text-danger mt-1 text-xs" id={`${id}-error`}>
          {issue}
        </p>
      ) : null}
    </div>
  );
}

function CalculationAudit({ items }: { items: readonly (readonly [string, string])[] }) {
  return (
    <dl className="border-border grid gap-x-5 gap-y-4 border-t pt-4 text-sm sm:grid-cols-2">
      {items.map(([label, value]) => (
        <div key={label}>
          <dt className="text-muted text-xs font-semibold">{label}</dt>
          <dd className="text-foreground mt-1 font-medium break-words">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function getValue(input: DkaStepsFiveToTenInput, path: readonly string[]): unknown {
  let value: unknown = input;
  for (const key of path) value = (value as Record<string, unknown>)[key];
  return value;
}

function statusLabel(status: string): string {
  return (
    {
      complete: "Source branch resolved",
      "not-reached": "Not reached",
      "requires-review": "Review required",
      stopped: "Path stopped",
    }[status] ?? "Not reached"
  );
}

function statusVariant(status: string): "danger" | "info" | "neutral" | "success" {
  return (
    {
      complete: "success" as const,
      "not-reached": "neutral" as const,
      "requires-review": "danger" as const,
      stopped: "info" as const,
    }[status] ?? "neutral"
  );
}
