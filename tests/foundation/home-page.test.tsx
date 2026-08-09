import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Home from "@/app/page";

describe("home page", () => {
  it("renders the source areas, migration status, and safeguards", () => {
    render(<Home />);

    expect(
      screen.getByRole("heading", { name: "Evidence-based electrolyte support" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Primary navigation" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "NICE Electrolyte CDS home" })).toBeInTheDocument();

    const statusLinks = screen.getAllByRole("link", { name: "View pathway status" });
    expect(statusLinks).not.toHaveLength(0);
    expect(statusLinks[0]).toHaveAttribute("href", "/assessment/new");
    expect(screen.getByRole("heading", { name: "Sodium" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Potassium" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Calcium" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Magnesium" })).toBeInTheDocument();
    expect(screen.getByText("0")).toBeInTheDocument();
    expect(screen.getByText("7")).toBeInTheDocument();
    expect(screen.getByText("Deferred")).toBeInTheDocument();
    expect(
      screen.getByText(/Do not enter real patient-identifiable information/i),
    ).toBeInTheDocument();
  });
});
