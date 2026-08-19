import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import HyperkalaemiaAssessmentPage, { metadata } from "@/app/review/hyperkalaemia/assessment/page";

describe("Hyperkalaemia timed management page", () => {
  it("shows the connected review gate, management progress and source-conflict boundary", () => {
    render(<HyperkalaemiaAssessmentPage />);

    expect(metadata.title).toBe("Hyperkalaemia timed management review");
    expect(
      screen.getByRole("heading", { name: "Hyperkalaemia timed management" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Unapproved treatment preview - do not use clinically"),
    ).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Assessment progress" })).toBeInTheDocument();
    expect(screen.getByText("Text labels only")).toBeInTheDocument();
    expect(screen.getByText("Clinical review pending")).toBeInTheDocument();
    expect(screen.getByText("Source conflict held")).toBeInTheDocument();
    expect(screen.getByText("Pathway v0.3.0")).toBeInTheDocument();
    expect(screen.queryByText("YSTHFT-ACUTE-HYPERKALAEMIA-V1")).not.toBeInTheDocument();
    expect(screen.queryByText(/page 2/i)).not.toBeInTheDocument();
  });
});
