"use client";

import { useCallback, useState } from "react";

import { PathwayProgress, SafetyAlert } from "@/components/clinical";

import {
  HyperkalaemiaTimedManagementReview,
  type HyperkalaemiaAssessmentProgress,
} from "./timed-management-review";

const initialProgress: HyperkalaemiaAssessmentProgress = {
  currentStepId: "potassium",
  ecgSkipped: false,
};

export function HyperkalaemiaAssessmentReview() {
  const [progress, setProgress] = useState(initialProgress);
  const handleProgressChange = useCallback((nextProgress: HyperkalaemiaAssessmentProgress) => {
    setProgress(nextProgress);
  }, []);
  const progressSteps = [
    { description: "Hyperkalaemia", id: "focus", label: "Assessment focus" },
    { description: "Confirm result", id: "potassium", label: "Potassium result" },
    {
      description: progress.ecgSkipped ? "Not required for mild result" : "Confirm findings",
      id: "ecg",
      label: "ECG review",
    },
    { description: "Review generated plan", id: "management", label: "Timed management" },
  ] as const;

  return (
    <>
      <section aria-labelledby="hyperkalaemia-ecg-progress-title">
        <h2 className="sr-only" id="hyperkalaemia-ecg-progress-title">
          Hyperkalaemia ECG pathway progress
        </h2>
        <PathwayProgress
          currentStepId={progress.currentStepId}
          skippedStepIds={progress.ecgSkipped ? ["ecg"] : []}
          steps={progressSteps}
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
        <HyperkalaemiaTimedManagementReview onProgressChange={handleProgressChange} />
        <aside aria-label="Review notes" className="space-y-5">
          <SafetyAlert level="warning" title="Clinical review pending">
            Drug doses, timings, monitoring and escalation remain locked until the formal clinical
            review package is approved.
          </SafetyAlert>
        </aside>
      </section>
    </>
  );
}
