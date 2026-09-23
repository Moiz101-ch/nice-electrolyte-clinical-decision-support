import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { HypomagnesaemiaSupportingGuidanceReview } from "@/components/pathways/hypomagnesaemia/supporting-guidance-review";
import { loadClinicalSourceRegistry } from "@/src/clinical/sources/registry";

describe("Hypomagnesaemia supporting-guidance review", () => {
  it("shows source limitations without presenting a treatment workflow", () => {
    const registry = loadClinicalSourceRegistry();
    const source = registry.getSource("TGICFT-HYPOMAGNESAEMIA-UNDATED")!;
    const linkedHypocalcaemiaSource = registry.getSource("YSTHFT-HYPOCALCAEMIA-V4")!;

    render(
      <HypomagnesaemiaSupportingGuidanceReview
        linkedHypocalcaemiaSource={linkedHypocalcaemiaSource}
        source={source}
      />,
    );

    expect(
      screen.getByRole("note", { name: /Supporting source only - no treatment pathway/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Registered supporting source" }),
    ).toBeInTheDocument();
    expect(screen.getByText(source.title)).toBeInTheDocument();
    expect(screen.getByText(/conflicting oral-dose wording/i)).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Current implementation boundary" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("spinbutton")).not.toBeInTheDocument();
    expect(screen.queryByRole("radio")).not.toBeInTheDocument();
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    expect(screen.queryByText(/10 mmol|24 mmol/i)).not.toBeInTheDocument();
  });
});
