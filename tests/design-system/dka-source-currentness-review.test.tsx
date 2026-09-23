import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DkaSourceCurrentnessReview } from "@/components/pathways/dka/source-currentness-review";
import {
  DKA_SOURCE_ID,
  dkaSourceRules,
  dkaSourceSteps,
  dkaSupplementarySections,
  evaluateDkaSourceCurrentnessGate,
} from "@/src/clinical/pathways/dka";
import { loadClinicalSourceRegistry } from "@/src/clinical/sources/registry";

describe("DKA source-currentness review", () => {
  it("exposes the overdue source and complete review map without clinical controls", () => {
    const registry = loadClinicalSourceRegistry();
    const source = registry.getSource(DKA_SOURCE_ID)!;
    const gate = evaluateDkaSourceCurrentnessGate(source, registry.auditedOn);

    render(
      <DkaSourceCurrentnessReview
        gate={gate}
        rules={dkaSourceRules}
        source={source}
        steps={dkaSourceSteps}
        supplementarySections={dkaSupplementarySections}
      />,
    );

    expect(
      screen.getByRole("alert", { name: /DKA calculator activation blocked/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("May 2019")).toBeInTheDocument();
    expect(screen.getByText("April 2021")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Clinical-review gate" })).toBeInTheDocument();
    expect(screen.getAllByText("Blocked")).toHaveLength(5);
    expect(screen.getAllByText(/^Step \d+$/)).toHaveLength(10);
    expect(screen.getByText(/minimum of \(weight in kg x 0.1/i)).toBeInTheDocument();
    expect(screen.getByText("Conflict blocks rule")).toBeInTheDocument();
    expect(
      screen.getByRole("note", { name: /Resolution criteria require clinical decision/i }),
    ).toBeInTheDocument();

    expect(screen.queryByRole("spinbutton")).not.toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.queryByRole("radio")).not.toBeInTheDocument();
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /approve|calculate|start/i }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(DKA_SOURCE_ID)).not.toBeInTheDocument();
    expect(screen.queryByText(/page \d+/i)).not.toBeInTheDocument();
  });
});
