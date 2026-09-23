import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { DkaStepsOneToFourReview } from "@/components/pathways/dka/steps-one-to-four-review";
import {
  DKA_SOURCE_ID,
  dkaSourceSteps,
  dkaSyntheticCases,
  evaluateDkaSourceCurrentnessGate,
  evaluateDkaStepsOneToFour,
  type DkaPreviewStepNumber,
} from "@/src/clinical/pathways/dka";
import { loadClinicalSourceRegistry } from "@/src/clinical/sources/registry";

describe("DKA Steps 1–4 technical review", () => {
  it("changes synthetic branches without exposing patient-entry controls", async () => {
    const user = userEvent.setup();
    const registry = loadClinicalSourceRegistry();
    const source = registry.getSource(DKA_SOURCE_ID)!;
    const gate = evaluateDkaSourceCurrentnessGate(source, registry.auditedOn);

    render(
      <DkaStepsOneToFourReview
        cases={dkaSyntheticCases.map((item) => ({
          ...item,
          result: evaluateDkaStepsOneToFour(item.input),
        }))}
        gate={gate}
        initialCaseId={dkaSyntheticCases[0]!.id}
        steps={dkaSourceSteps.slice(0, 4).map((step) => ({
          stepNumber: step.stepNumber as DkaPreviewStepNumber,
          title: step.title,
        }))}
      />,
    );

    expect(screen.getByRole("alert", { name: /Technical preview only/i })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Test scenario" })).toBeInTheDocument();
    expect(screen.getByText("Initial checks confirmed")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Step 4/i }));
    expect(screen.getByRole("heading", { name: "Calculation audit" })).toBeInTheDocument();
    expect(screen.getAllByText("7.2 units/hour")).toHaveLength(2);

    await user.selectOptions(
      screen.getByRole("combobox", { name: "Test scenario" }),
      "pressure-recovered",
    );
    await user.click(screen.getByRole("button", { name: /Step 4/i }));
    expect(screen.getByText("15 units/hour")).toBeInTheDocument();
    expect(screen.getByText(/Limit applied/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Review Steps 5-10/i })).toHaveAttribute(
      "href",
      "/review/dka/steps-five-to-ten?initial=pressure-recovered",
    );

    await user.selectOptions(
      screen.getByRole("combobox", { name: "Test scenario" }),
      "pressure-boundary",
    );
    await user.click(screen.getByRole("button", { name: /Step 3/i }));
    expect(screen.getByText(/Repeat pressure boundary is unresolved/)).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Calculation audit" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Review Steps 5-10/i })).not.toBeInTheDocument();

    expect(screen.queryByRole("spinbutton")).not.toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.queryByRole("radio")).not.toBeInTheDocument();
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    expect(screen.queryByText(DKA_SOURCE_ID)).not.toBeInTheDocument();
    expect(screen.queryByText(/page \d+/i)).not.toBeInTheDocument();
  });
});
