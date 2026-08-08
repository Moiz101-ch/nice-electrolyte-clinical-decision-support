import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Home from "@/app/page";

describe("home page", () => {
  it("renders the primary action, electrolyte categories, coverage, and safeguards", () => {
    render(<Home />);

    expect(
      screen.getByRole("heading", { name: "Evidence-based electrolyte support" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Primary navigation" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "NICE Electrolyte CDS home" })).toBeInTheDocument();

    const startAssessmentLinks = screen.getAllByRole("link", { name: "Start new assessment" });
    expect(startAssessmentLinks).not.toHaveLength(0);
    expect(startAssessmentLinks[0]).toHaveAttribute("href", "/assessment/new");
    expect(screen.getByRole("heading", { name: "Sodium" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Potassium" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Calcium" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Magnesium" })).toBeInTheDocument();
    expect(screen.getByText("17")).toBeInTheDocument();
    expect(screen.getByText("3 of 4")).toBeInTheDocument();
    expect(screen.getByText("Off by default")).toBeInTheDocument();
    expect(
      screen.getByText(/Do not enter real patient-identifiable information/i),
    ).toBeInTheDocument();
  });
});
