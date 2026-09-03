import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Home from "@/app/page";

describe("pathway-first home page", () => {
  it("renders the primary pathways with registry-derived review metadata", () => {
    render(<Home />);

    expect(
      screen.getByRole("heading", { name: "Acute electrolyte management" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Hyponatraemia" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Hyperkalaemia" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Hypocalcaemia" })).toBeInTheDocument();
    expect(screen.getAllByText("Awaiting clinical review")).toHaveLength(3);
    expect(screen.getByText("Feb 2028")).toBeInTheDocument();
    expect(screen.getByText("Nov 2026")).toBeInTheDocument();
    expect(screen.getByText("Oct 2027")).toBeInTheDocument();

    const pathwayButtons = screen.getAllByRole("button", { name: "Start pathway" });
    expect(pathwayButtons).toHaveLength(3);
    pathwayButtons.forEach((button) => expect(button).toBeDisabled());
  });

  it("renders calculators, governance counts, safety, and the new navigation", () => {
    render(<Home />);

    expect(
      screen.getByRole("heading", { name: "Clinical calculators & pathways" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "DKA management pathway" })).toBeInTheDocument();
    expect(screen.getByText("Source review overdue")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open calculator" })).toBeDisabled();
    expect(screen.getByText("8")).toBeInTheDocument();
    expect(screen.getByText("0")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();

    expect(screen.getByRole("link", { name: "Electrolyte Pathways home" })).toBeInTheDocument();
    const primaryNavigation = screen.getByRole("navigation", { name: "Primary navigation" });

    for (const label of [
      "Home",
      "New assessment",
      "Clinical pathways",
      "Source guidelines",
      "Calculators",
      "About & safety",
    ]) {
      expect(within(primaryNavigation).getByRole("link", { name: label })).toBeInTheDocument();
    }
    expect(screen.queryByText("My assessments")).not.toBeInTheDocument();
    expect(screen.getByText("No pathway is approved for clinical use")).toBeInTheDocument();
  });
});
