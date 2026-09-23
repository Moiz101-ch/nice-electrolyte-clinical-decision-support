import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { DkaCalculatorFoundationReview } from "@/components/pathways/dka/calculator-foundation-review";
import {
  DKA_SOURCE_ID,
  createDkaCalculatorFoundationSession,
  dkaInputKindContracts,
  dkaTransparentResultFields,
  evaluateDkaSourceCurrentnessGate,
  getDkaFoundationDisplaySteps,
} from "@/src/clinical/pathways/dka";
import { loadClinicalSourceRegistry } from "@/src/clinical/sources/registry";

describe("DKA calculator-foundation review", () => {
  it("navigates the source map while keeping clinical execution absent", async () => {
    const user = userEvent.setup();
    const registry = loadClinicalSourceRegistry();
    const source = registry.getSource(DKA_SOURCE_ID)!;
    const gate = evaluateDkaSourceCurrentnessGate(source, registry.auditedOn);

    render(
      <DkaCalculatorFoundationReview
        gate={gate}
        initialSession={createDkaCalculatorFoundationSession()}
        inputKindContracts={dkaInputKindContracts}
        resultFields={dkaTransparentResultFields}
        steps={getDkaFoundationDisplaySteps()}
      />,
    );

    expect(
      screen.getByRole("alert", { name: /Clinical execution remains locked/i }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("tab")).toHaveLength(10);
    expect(screen.getByRole("tab", { name: "Step 1" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: "Step 1" })).toHaveAttribute("tabindex", "0");
    expect(screen.getByRole("tab", { name: "Step 2" })).toHaveAttribute("tabindex", "-1");
    expect(screen.getByRole("heading", { name: "Initial assessment" })).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Step 4" }));
    expect(screen.getByRole("tab", { name: "Step 4" })).toHaveAttribute("aria-selected", "true");
    expect(
      screen.getByRole("heading", { name: "Start fixed-rate IV insulin infusion" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Initial insulin infusion rate")).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Step 9" }));
    expect(screen.getByText("DKA resolution")).toBeInTheDocument();
    expect(screen.getByText("Conflict")).toBeInTheDocument();

    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Step 10" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: "Step 10" })).toHaveFocus();
    await user.keyboard("{Home}");
    expect(screen.getByRole("tab", { name: "Step 1" })).toHaveAttribute("aria-selected", "true");

    expect(screen.getByText("Declared clinical inputs: 0")).toBeInTheDocument();
    expect(screen.getByText(/stored inputs 0; calculated results 0/i)).toBeInTheDocument();
    expect(screen.queryByRole("spinbutton")).not.toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.queryByRole("radio")).not.toBeInTheDocument();
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    expect(screen.queryByText(DKA_SOURCE_ID)).not.toBeInTheDocument();
    expect(screen.queryByText(/page \d+/i)).not.toBeInTheDocument();
  });
});
