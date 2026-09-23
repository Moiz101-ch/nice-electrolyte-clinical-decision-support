import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import DkaStepsOneToFourPage from "@/app/review/dka/steps-one-to-four/page";
import DkaStepsFiveToTenPage from "@/app/review/dka/steps-five-to-ten/page";
import DkaCalculatorFoundationPage from "@/app/review/dka/calculator/page";
import DkaSourceCurrentnessPage from "@/app/review/dka/source-currentness/page";

describe("DKA technical-preview deployment gate", () => {
  it("does not render source-derived preview controls outside local development", async () => {
    render(await DkaStepsOneToFourPage({ searchParams: Promise.resolve({}) }));

    expect(screen.getByRole("heading", { level: 1, name: "DKA Steps 1–4" })).toBeInTheDocument();
    expect(
      screen.getByRole("alert", { name: /Technical preview unavailable/i }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("combobox", { name: "Test scenario" })).not.toBeInTheDocument();
    expect(screen.queryByText(/50 units of soluble insulin/i)).not.toBeInTheDocument();
  });

  it("does not render later source branches outside local development", async () => {
    render(await DkaStepsFiveToTenPage({ searchParams: Promise.resolve({}) }));

    expect(screen.getByRole("heading", { level: 1, name: "DKA Steps 5-10" })).toBeInTheDocument();
    expect(
      screen.getByRole("alert", { name: /Technical preview unavailable/i }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("combobox", { name: "Test scenario" })).not.toBeInTheDocument();
    expect(screen.queryByText(/potassium chloride/i)).not.toBeInTheDocument();
  });

  it("keeps detailed source mapping off the public review pages", () => {
    const sourcePage = render(<DkaSourceCurrentnessPage />);
    expect(
      screen.getByRole("alert", { name: /Detailed source review unavailable/i }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/glucose > 11 AND ketones > 3/i)).not.toBeInTheDocument();
    sourcePage.unmount();

    render(<DkaCalculatorFoundationPage />);
    expect(
      screen.getByRole("alert", { name: /Calculator review unavailable/i }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Review Steps 1–4" })).not.toBeInTheDocument();
  });
});
