import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import HyponatraemiaSeverityPage, { metadata } from "@/app/review/hyponatraemia/severity/page";

describe("hyponatraemia severity review page", () => {
  it("shows the review gate, boundary ambiguity and classification-only state", () => {
    render(<HyponatraemiaSeverityPage />);

    expect(metadata.title).toBe("Hyponatraemia severity review");
    expect(screen.getByRole("heading", { name: "Sodium severity review" })).toBeInTheDocument();
    expect(screen.getByText("Classification only — no management output")).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Assessment progress" })).toBeInTheDocument();
    expect(screen.getByText("Boundary requires clinical review")).toBeInTheDocument();
    expect(screen.queryByText("YSTHFT-HYPONATRAEMIA-EMERGENCY-V1")).not.toBeInTheDocument();
    expect(screen.getByText("Pathway v0.1.0")).toBeInTheDocument();
  });
});
