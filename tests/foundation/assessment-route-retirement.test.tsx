import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import NewAssessmentPage from "@/app/assessment/new/page";

describe("retired generic assessment route", () => {
  it("fails closed without rendering clinical inputs or result controls", () => {
    render(<NewAssessmentPage />);

    expect(
      screen.getByRole("heading", { name: "Clinical pathways are under review" }),
    ).toBeInTheDocument();
    expect(screen.getByText("No active clinical assessment")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open Hyponatraemia review" })).toHaveAttribute(
      "href",
      "/review/hyponatraemia/assessment",
    );
    expect(screen.getByRole("link", { name: "Open Hyperkalaemia review" })).toHaveAttribute(
      "href",
      "/review/hyperkalaemia/assessment",
    );
    expect(screen.getByRole("link", { name: "Return home" })).toHaveAttribute("href", "/");
    expect(screen.queryByRole("form")).not.toBeInTheDocument();
    expect(screen.queryByRole("spinbutton")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /generate result/i })).not.toBeInTheDocument();
  }, 10_000);
});
