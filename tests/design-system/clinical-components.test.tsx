import { Activity } from "lucide-react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import {
  GroupedSymptomSelection,
  MajorDecisionCards,
  MonitoringTimeline,
  NumericClinicalInput,
  PathwayProgress,
  ResultSection,
  ReviewStatusBadge,
  SafetyAlert,
} from "@/components/clinical";

describe("shared clinical pathway components", () => {
  it("announces pathway progress and associates numeric input guidance", () => {
    render(
      <>
        <PathwayProgress
          currentStepId="findings"
          steps={[
            { id: "focus", label: "Focus" },
            { id: "findings", label: "Findings" },
            { id: "result", label: "Result" },
          ]}
        />
        <NumericClinicalInput
          description="Confirm the displayed unit."
          error="Enter a valid result."
          id="example-result"
          label="Example result"
          required
          unit="mmol/L"
        />
      </>,
    );

    expect(screen.getByRole("navigation", { name: "Assessment progress" })).toBeInTheDocument();
    expect(screen.getByText("Findings").closest("li")).toHaveAttribute("aria-current", "step");

    const input = screen.getByRole("spinbutton", { name: /Example result/i });
    expect(input).toBeInvalid();
    expect(input).toHaveAccessibleDescription("Confirm the displayed unit. Enter a valid result.");
  });

  it("distinguishes a skipped pathway step from a completed step", () => {
    render(
      <PathwayProgress
        currentStepId="result"
        skippedStepIds={["findings"]}
        steps={[
          { id: "focus", label: "Focus" },
          { id: "findings", label: "Findings" },
          { id: "result", label: "Result" },
        ]}
      />,
    );

    expect(screen.getByText("Findings").closest("li")).toHaveTextContent("Status: skipped");
    expect(screen.getByText("Result").closest("li")).toHaveAttribute("aria-current", "step");
  });

  it("uses native radio and checkbox behavior for clinical selections", async () => {
    const user = userEvent.setup();

    render(
      <>
        <MajorDecisionCards
          defaultValue="a"
          legend="Clinical context"
          name="context"
          options={[
            { description: "First context", label: "Context A", value: "a" },
            { description: "Second context", label: "Context B", value: "b" },
          ]}
        />
        <GroupedSymptomSelection
          groups={[
            {
              id: "reported",
              label: "Reported symptoms",
              options: [
                { label: "Headache", value: "headache" },
                { label: "Nausea", value: "nausea" },
              ],
            },
          ]}
          legend="Symptoms"
          name="symptoms"
        />
      </>,
    );

    const contextA = screen.getByRole("radio", { name: /Context A/ });
    const contextB = screen.getByRole("radio", { name: /Context B/ });
    expect(contextA).toBeChecked();

    await user.click(contextB);
    expect(contextB).toBeChecked();
    expect(contextA).not.toBeChecked();

    const headache = screen.getByRole("checkbox", { name: "Headache" });
    await user.click(headache);
    expect(headache).toBeChecked();
  });

  it("reports controlled major-decision changes", async () => {
    const onValueChange = vi.fn();
    const user = userEvent.setup();

    render(
      <MajorDecisionCards
        legend="Controlled context"
        name="controlled-context"
        onValueChange={onValueChange}
        options={[
          { description: "First context", label: "Context A", value: "a" },
          { description: "Second context", label: "Context B", value: "b" },
        ]}
        value="a"
      />,
    );

    await user.click(screen.getByText("Context B"));
    expect(onValueChange).toHaveBeenCalledWith("b");
  });

  it("reports controlled symptom-selection changes", async () => {
    const onValuesChange = vi.fn();
    const user = userEvent.setup();

    render(
      <GroupedSymptomSelection
        groups={[
          {
            id: "reported",
            label: "Reported symptoms",
            options: [
              { label: "Headache", value: "headache" },
              { label: "Nausea", value: "nausea" },
            ],
          },
        ]}
        legend="Controlled symptoms"
        name="controlled-symptoms"
        onValuesChange={onValuesChange}
        values={["headache"]}
      />,
    );

    await user.click(screen.getByRole("checkbox", { name: "Nausea" }));
    expect(onValuesChange).toHaveBeenCalledWith(["headache", "nausea"]);
  });

  it("presents safety, monitoring, result, and review states", () => {
    render(
      <>
        <SafetyAlert level="critical" title="Escalate now">
          Follow the approved emergency process.
        </SafetyAlert>
        <MonitoringTimeline
          items={[
            {
              description: "Baseline recorded.",
              id: "baseline",
              label: "Initial assessment",
              status: "complete",
              timing: "At presentation",
            },
          ]}
          title="Monitoring"
        />
        <ResultSection icon={Activity} title="Monitoring result">
          No schedule generated.
        </ResultSection>
        <ReviewStatusBadge status="awaiting-clinical-review" />
        <ReviewStatusBadge status="approved-for-project-use" />
      </>,
    );

    expect(screen.getByRole("alert", { name: /Critical safety alert/ })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Monitoring" })).toBeInTheDocument();
    expect(screen.queryByRole("radio")).not.toBeInTheDocument();
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    expect(screen.getByText("Complete")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Monitoring result" })).toBeInTheDocument();
    expect(screen.getByText("Awaiting clinical review")).toBeInTheDocument();
    expect(screen.getByText("Approved for project use")).toBeInTheDocument();
  });
});
