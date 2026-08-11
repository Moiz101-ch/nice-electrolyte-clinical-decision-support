"use client";

import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export interface MajorDecisionOption {
  description: string;
  disabled?: boolean;
  icon?: LucideIcon;
  label: string;
  value: string;
}

export interface MajorDecisionCardsProps {
  defaultValue?: string;
  description?: string;
  legend: string;
  name: string;
  onValueChange?: (value: string) => void;
  options: readonly MajorDecisionOption[];
  required?: boolean;
  value?: string;
}

export function MajorDecisionCards({
  defaultValue,
  description,
  legend,
  name,
  onValueChange,
  options,
  required = false,
  value,
}: MajorDecisionCardsProps) {
  const descriptionId = description ? `${name}-description` : undefined;

  return (
    <fieldset aria-describedby={descriptionId}>
      <legend className="text-foreground text-sm font-semibold">
        {legend}
        {required ? (
          <>
            <span aria-hidden="true" className="text-danger ml-1">
              *
            </span>
            <span className="sr-only"> (required)</span>
          </>
        ) : null}
      </legend>
      {description ? (
        <p className="text-muted mt-1 text-xs leading-5" id={descriptionId}>
          {description}
        </p>
      ) : null}
      <div
        className={cn(
          "mt-3 grid gap-3",
          options.length === 2
            ? "md:grid-cols-2"
            : options.length >= 4
              ? "md:grid-cols-2 xl:grid-cols-4"
              : "md:grid-cols-3",
        )}
      >
        {options.map((option) => {
          const Icon = option.icon;
          const optionId = `${name}-${option.value}`;

          return (
            <label className="block h-full" htmlFor={optionId} key={option.value}>
              <input
                className="peer sr-only"
                disabled={option.disabled}
                id={optionId}
                name={name}
                onChange={() => onValueChange?.(option.value)}
                required={required}
                type="radio"
                value={option.value}
                {...(value === undefined
                  ? { defaultChecked: option.value === defaultValue }
                  : { checked: option.value === value })}
              />
              <span className="border-border bg-surface peer-checked:border-primary peer-checked:bg-info-subtle peer-focus-visible:ring-focus/30 peer-disabled:bg-surface-subtle peer-disabled:text-muted flex h-full min-h-40 cursor-pointer flex-col rounded-md border p-4 shadow-xs peer-focus-visible:ring-2 peer-disabled:cursor-not-allowed">
                {Icon ? (
                  <span className="bg-surface-subtle text-primary flex size-9 items-center justify-center rounded-md">
                    <Icon aria-hidden="true" className="size-4.5" strokeWidth={1.8} />
                  </span>
                ) : null}
                <span className={cn("text-foreground block text-sm font-semibold", Icon && "mt-3")}>
                  {option.label}
                </span>
                <span className="text-muted mt-1 block text-xs leading-5">
                  {option.description}
                </span>
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

export interface SymptomSelectionOption {
  description?: string;
  label: string;
  value: string;
}

export interface SymptomSelectionGroup {
  description?: string;
  id: string;
  label: string;
  options: readonly SymptomSelectionOption[];
}

export interface GroupedSymptomSelectionProps {
  defaultValues?: readonly string[];
  description?: string;
  groups: readonly SymptomSelectionGroup[];
  legend: string;
  name: string;
  onValuesChange?: (values: readonly string[]) => void;
  values?: readonly string[];
}

export function GroupedSymptomSelection({
  defaultValues = [],
  description,
  groups,
  legend,
  name,
  onValuesChange,
  values,
}: GroupedSymptomSelectionProps) {
  const descriptionId = description ? `${name}-description` : undefined;

  return (
    <fieldset aria-describedby={descriptionId}>
      <legend className="text-foreground text-sm font-semibold">{legend}</legend>
      {description ? (
        <p className="text-muted mt-1 text-xs leading-5" id={descriptionId}>
          {description}
        </p>
      ) : null}
      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        {groups.map((group) => (
          <section className="py-4 last:odd:lg:col-span-2" key={group.id}>
            <h3 className="text-foreground text-sm font-semibold">{group.label}</h3>
            {group.description ? (
              <p className="text-muted mt-1 text-xs leading-5">{group.description}</p>
            ) : null}
            <div className="border-border mt-3 divide-y border-y">
              {group.options.map((option) => {
                const optionId = `${name}-${group.id}-${option.value}`;

                return (
                  <label
                    className="hover:bg-surface-subtle flex min-h-12 cursor-pointer items-start gap-3 py-3"
                    htmlFor={optionId}
                    key={option.value}
                  >
                    <input
                      className="accent-primary mt-0.5 size-4 shrink-0"
                      id={optionId}
                      name={`${name}-${group.id}`}
                      onChange={(event) => {
                        const currentValues = values ?? defaultValues;
                        const nextValues = event.target.checked
                          ? [...new Set([...currentValues, option.value])]
                          : currentValues.filter((value) => value !== option.value);

                        onValuesChange?.(nextValues);
                      }}
                      type="checkbox"
                      value={option.value}
                      {...(values === undefined
                        ? { defaultChecked: defaultValues.includes(option.value) }
                        : { checked: values.includes(option.value) })}
                    />
                    <span className="min-w-0">
                      <span className="text-foreground block text-sm font-medium">
                        {option.label}
                      </span>
                      {option.description ? (
                        <span className="text-muted mt-0.5 block text-xs leading-5">
                          {option.description}
                        </span>
                      ) : null}
                    </span>
                  </label>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </fieldset>
  );
}
