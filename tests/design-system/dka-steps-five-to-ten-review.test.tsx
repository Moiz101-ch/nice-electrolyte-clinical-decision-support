import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { DkaStepsFiveToTenReview } from "@/components/pathways/dka/steps-five-to-ten-review";
import {
  DKA_SOURCE_ID,
  dkaLaterSyntheticCases,
  dkaSourceSteps,
  dkaSyntheticCases,
  evaluateDkaSourceCurrentnessGate,
  evaluateDkaStepsFiveToTen,
  evaluateDkaStepsOneToFour,
  type DkaLaterStepNumber,
} from "@/src/clinical/pathways/dka";
import { loadClinicalSourceRegistry } from "@/src/clinical/sources/registry";

describe("DKA Steps 5-10 technical review", () => {
  it("switches only fixed synthetic scenarios and preserves the initial context", async () => {
    const user = userEvent.setup();
    const registry = loadClinicalSourceRegistry();
    const gate = evaluateDkaSourceCurrentnessGate(
      registry.getSource(DKA_SOURCE_ID)!,
      registry.auditedOn,
    );
    const initialCase = dkaSyntheticCases.find((item) => item.id === "pressure-recovered")!;
    const initialRate = evaluateDkaStepsOneToFour(initialCase.input).calculation?.output.value;

    render(
      <DkaStepsFiveToTenReview
        cases={dkaLaterSyntheticCases.map((item) => {
          const input = {
            ...item.input,
            initial: initialCase.input,
            monitoring: { ...item.input.monitoring, insulinRateUnitsPerHour: initialRate ?? null },
          };
          return { ...item, input, result: evaluateDkaStepsFiveToTen(input) };
        })}
        gate={gate}
        initialCaseLabel={initialCase.label}
        steps={dkaSourceSteps.slice(4).map((step) => ({
          stepNumber: step.stepNumber as DkaLaterStepNumber,
          title: step.title,
        }))}
      />,
    );

    expect(screen.getByText("Initial context: Pressure recovers")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Step 7/i }));
    expect(
      screen.getByRole("heading", { name: "Urine-output calculation audit" }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("80 mL/hour")).toHaveLength(2);
    expect(screen.getByText("15 units/hour")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Step 8/i }));
    expect(screen.getByText("Met in synthetic case")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Step 9/i }));
    expect(
      screen.getByRole("alert", { name: /Resolution rule is not executable/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/No automated DKA-resolution result/i)).toBeInTheDocument();

    await user.selectOptions(
      screen.getByRole("combobox", { name: "Test scenario" }),
      "pump-insulin",
    );
    await user.click(screen.getByRole("button", { name: /Step 10/i }));
    expect(
      screen.getByRole("heading", { name: "Isolated conversion mapping" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/recommence pump at the normal basal rate/i)).toBeInTheDocument();
    expect(screen.getByText("Not executable")).toBeInTheDocument();

    expect(screen.queryByRole("spinbutton")).not.toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.queryByText(DKA_SOURCE_ID)).not.toBeInTheDocument();
    expect(screen.queryByText(/page \d+/i)).not.toBeInTheDocument();
  });
});
