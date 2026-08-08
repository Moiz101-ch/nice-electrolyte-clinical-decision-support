import type { Metadata } from "next";

import { AssessmentWorkflow } from "@/components/assessment/assessment-workflow";
import { AppShell } from "@/components/layout/app-shell";

export const metadata: Metadata = {
  title: "New assessment",
};

export default function NewAssessmentPage() {
  return (
    <AppShell>
      <AssessmentWorkflow />
    </AppShell>
  );
}
