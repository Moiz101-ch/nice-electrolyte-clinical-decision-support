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
    expect(screen.getAllByText("Interactive")).toHaveLength(3);
    expect(screen.getByText("Feb 2028")).toBeInTheDocument();
    expect(screen.getByText("Nov 2026")).toBeInTheDocument();
    expect(screen.getByText("Oct 2027")).toBeInTheDocument();

    for (const [name, href] of [
      ["Hyponatraemia", "/review/hyponatraemia/assessment"],
      ["Hyperkalaemia", "/review/hyperkalaemia/assessment"],
      ["Hypocalcaemia", "/review/hypocalcaemia/assessment"],
    ]) {
      expect(screen.getByRole("link", { name: `Open ${name} assessment` })).toHaveAttribute(
        "href",
        href,
      );
    }
  });

  it("renders calculators, governance counts, safety, and the new navigation", () => {
    render(<Home />);

    expect(
      screen.getByRole("heading", { name: "Clinical calculators & pathways" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "DKA management pathway" })).toBeInTheDocument();
    expect(screen.getByText("JBDS calculator")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open DKA calculator" })).toHaveAttribute(
      "href",
      "/review/dka/current-calculator",
    );
    expect(screen.getByText("9")).toBeInTheDocument();
    expect(screen.getByText("0")).toBeInTheDocument();
    expect(screen.getByText("Interactive workflows").parentElement).toHaveTextContent("4");

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
