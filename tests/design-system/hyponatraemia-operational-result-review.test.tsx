import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { HyponatraemiaOperationalResultReview } from "@/components/pathways/hyponatraemia/operational-result-review";

describe("hyponatraemia operational result review", () => {
  it("presents the operational result in clinical priority order", () => {
    render(<HyponatraemiaOperationalResultReview />);

    expect(screen.getByRole("heading", { name: "Severe hyponatraemia" })).toBeInTheDocument();
    expect(
      within(screen.getByLabelText("Operational result summary")).getByText(
        "Symptomatic emergency management",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Immediate actions" })).toBeInTheDocument();
    expect(screen.getByText(/150 mL of 2.7% hypertonic saline/)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Correction target" })).toBeInTheDocument();
    expect(screen.getByText(/increase sodium by 4-6 mmol\/L/)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Monitoring" })).toBeInTheDocument();
    expect(screen.getByText("Hourly until the target increase")).toBeInTheDocument();
  });

  it("shows safety, next steps, escalation, causes and deterministic rationale", () => {
    render(<HyponatraemiaOperationalResultReview />);

    expect(screen.getByRole("alert", { name: /Maximum correction limit/ })).toHaveTextContent(
      "Avoid correction of more than 10 mmol/L in 24 hours",
    );
    expect(screen.getByRole("heading", { name: "Next steps" })).toBeInTheDocument();
    expect(
      screen.getByText("Diagnose and manage the cause with consultant review."),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Escalation" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "SIADH-compatible pattern" })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Why this result was selected" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Sodium 124 mmol\/L selected Severe hyponatraemia/),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Clinical review status" })).toBeInTheDocument();
  });

  it("does not render internal source identifiers, file references or page numbers", () => {
    const { container } = render(<HyponatraemiaOperationalResultReview />);
    const visibleText = container.textContent ?? "";

    expect(visibleText).not.toMatch(
      /YSTHFT-|UNVERIFIED-HYPONATRAEMIA|Registry ID|Mapped location|Page 1|Reference:|\.pdf/i,
    );
  });
});
