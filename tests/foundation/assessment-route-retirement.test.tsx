import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import NewAssessmentPage from "@/app/assessment/new/page";

describe("assessment chooser", () => {
  it("links to interactive workflows without rendering clinical inputs", () => {
    render(<NewAssessmentPage />);

    expect(screen.getByRole("heading", { name: "Choose an assessment" })).toBeInTheDocument();
    expect(screen.getByText("Technical use only")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open Hyponatraemia workflow" })).toHaveAttribute(
      "href",
      "/review/hyponatraemia/assessment",
    );
    expect(screen.getByRole("link", { name: "Open Hyperkalaemia workflow" })).toHaveAttribute(
      "href",
      "/review/hyperkalaemia/assessment",
    );
    expect(screen.getByRole("link", { name: "Open Hypocalcaemia workflow" })).toHaveAttribute(
      "href",
      "/review/hypocalcaemia/assessment",
    );
    expect(
      screen.getByRole("link", { name: "Open Diabetic ketoacidosis workflow" }),
    ).toHaveAttribute("href", "/review/dka/current-calculator");
    expect(screen.getAllByRole("link", { name: "Home" })[0]).toHaveAttribute("href", "/");
    expect(screen.queryByRole("form")).not.toBeInTheDocument();
    expect(screen.queryByRole("spinbutton")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /generate result/i })).not.toBeInTheDocument();
  }, 10_000);
});
