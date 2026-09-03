import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import HypocalcaemiaAssessmentPage, { metadata } from "@/app/review/hypocalcaemia/assessment/page";

describe("Hypocalcaemia assessment review page", () => {
  it("renders the review-gated connected assessment route", () => {
    render(<HypocalcaemiaAssessmentPage />);

    expect(metadata.title).toBe("Hypocalcaemia assessment and management review");
    expect(
      screen.getByRole("heading", { name: "Hypocalcaemia assessment and management", level: 1 }),
    ).toBeInTheDocument();
    expect(screen.getByRole("alert", { name: /Unapproved pathway preview/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Pathway reviews" })).toHaveAttribute(
      "href",
      "/assessment/new",
    );
    expect(screen.getByText("Pathway v0.3.0")).toBeInTheDocument();
  });
});
