import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import HyperkalaemiaAssessmentPage, { metadata } from "@/app/review/hyperkalaemia/assessment/page";

describe("Hyperkalaemia ECG assessment page", () => {
  it("shows the connected review gate, scoped progress and visual-asset boundary", () => {
    render(<HyperkalaemiaAssessmentPage />);

    expect(metadata.title).toBe("Hyperkalaemia ECG assessment review");
    expect(
      screen.getByRole("heading", { name: "Hyperkalaemia ECG assessment" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Technical review only - treatment remains incomplete"),
    ).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Assessment progress" })).toBeInTheDocument();
    expect(screen.getByText("Text labels only")).toBeInTheDocument();
    expect(screen.getByText("Pathway v0.2.0")).toBeInTheDocument();
    expect(screen.queryByText("YSTHFT-ACUTE-HYPERKALAEMIA-V1")).not.toBeInTheDocument();
    expect(screen.queryByText(/page 2/i)).not.toBeInTheDocument();
  });
});
