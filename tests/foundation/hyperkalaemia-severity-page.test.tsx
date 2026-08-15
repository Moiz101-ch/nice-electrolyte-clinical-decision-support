import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import HyperkalaemiaSeverityPage, { metadata } from "@/app/review/hyperkalaemia/severity/page";

describe("Hyperkalaemia severity review page", () => {
  it("shows the review gate, source boundary warning and scoped progress", () => {
    render(<HyperkalaemiaSeverityPage />);

    expect(metadata.title).toBe("Hyperkalaemia severity review");
    expect(screen.getByRole("heading", { name: "Potassium severity review" })).toBeInTheDocument();
    expect(screen.getByText("Technical review only - no treatment output")).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Assessment progress" })).toBeInTheDocument();
    expect(screen.getByText("Reporting precision requires review")).toBeInTheDocument();
    expect(screen.getByText("Pathway v0.1.0")).toBeInTheDocument();
    expect(screen.queryByText("YSTHFT-ACUTE-HYPERKALAEMIA-V1")).not.toBeInTheDocument();
    expect(screen.queryByText(/page 2/i)).not.toBeInTheDocument();
  });
});
