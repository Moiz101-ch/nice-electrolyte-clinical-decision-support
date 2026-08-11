"use client";

import { CircleHelp, GitBranch, Split } from "lucide-react";

import {
  GroupedSymptomSelection,
  MajorDecisionCards,
  NumericClinicalInput,
} from "@/components/clinical";

const decisionOptions = [
  {
    description: "An illustrative primary pathway branch.",
    icon: GitBranch,
    label: "Context option A",
    value: "context-a",
  },
  {
    description: "An illustrative alternative pathway branch.",
    icon: Split,
    label: "Context option B",
    value: "context-b",
  },
  {
    description: "Records uncertainty without forcing a clinical choice.",
    icon: CircleHelp,
    label: "Unable to determine",
    value: "uncertain",
  },
] as const;

const symptomGroups = [
  {
    description: "Common findings can be collected together.",
    id: "reported",
    label: "Reported symptoms",
    options: [
      { label: "Headache", value: "headache" },
      { label: "Nausea", value: "nausea" },
      { label: "Weakness", value: "weakness" },
    ],
  },
  {
    description: "Potential red flags remain visually distinct.",
    id: "urgent",
    label: "Urgent features",
    options: [
      { label: "Seizure activity", value: "seizure" },
      { label: "Reduced consciousness", value: "reduced-consciousness" },
      { label: "Rapid clinical deterioration", value: "deterioration" },
    ],
  },
] as const;

export function PathwayControlExamples() {
  return (
    <>
      <div className="mt-6 max-w-xl">
        <NumericClinicalInput
          defaultValue="123.4"
          description="Decimal entry and unit presentation only; no interpretation is performed."
          id="example-laboratory-result"
          label="Example laboratory result"
          min="0"
          required
          step="0.1"
          unit="mmol/L"
        />
      </div>

      <div className="mt-7">
        <MajorDecisionCards
          defaultValue="context-b"
          description="Choose one mutually exclusive state. These labels do not represent an active pathway."
          legend="Major decision"
          name="example-context"
          options={decisionOptions}
          required
        />
      </div>

      <div className="mt-7">
        <GroupedSymptomSelection
          defaultValues={["headache"]}
          description="Select every finding that is explicitly confirmed. No selection changes the preview result."
          groups={symptomGroups}
          legend="Grouped symptom selection"
          name="example-symptoms"
        />
      </div>
    </>
  );
}
