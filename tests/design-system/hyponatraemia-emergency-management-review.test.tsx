import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { HyponatraemiaEmergencyManagementReview } from "@/components/pathways/hyponatraemia/emergency-management-review";

describe("hyponatraemia emergency-management review", () => {
  it("shows initial actions, target and correction limit before follow-up choices", () => {
    render(<HyponatraemiaEmergencyManagementReview />);

    expect(screen.getByRole("heading", { name: "Severe hyponatraemia" })).toBeInTheDocument();
    expect(screen.getByRole("alert", { name: /Maximum correction limit/ })).toHaveTextContent(
      "Avoid correction of more than 10 mmol/L in 24 hours",
    );
    expect(screen.getByText(/150 mL of 2.7% hypertonic saline/)).toBeInTheDocument();
    expect(screen.getByText(/Goal: increase sodium by 4-6 mmol\/L/)).toBeInTheDocument();
    expect(screen.getAllByRole("radio")).toHaveLength(3);
    expect(screen.queryByText("Has there been symptomatic improvement?")).not.toBeInTheDocument();
  });

  it("adds high-risk monitoring and reveals the response question adaptively", async () => {
    const user = userEvent.setup();
    render(<HyponatraemiaEmergencyManagementReview />);

    await user.click(screen.getByRole("radio", { name: /High risk confirmed/ }));
    expect(screen.getByRole("heading", { name: "High-risk ODS monitoring" })).toBeInTheDocument();
    expect(screen.getByText("Hourly sodium monitoring")).toBeInTheDocument();
    expect(screen.getByText("Then every 4-6 hours")).toBeInTheDocument();
    expect(screen.getByText("Has there been symptomatic improvement?")).toBeInTheDocument();
  });

  it("routes persistent symptoms and a low four-hour increase to repeat treatment", async () => {
    const user = userEvent.setup();
    render(<HyponatraemiaEmergencyManagementReview />);

    await user.click(screen.getByRole("radio", { name: /High risk not confirmed/ }));
    await user.click(screen.getByRole("radio", { name: /No symptomatic improvement/ }));
    const input = screen.getByRole("spinbutton", { name: /Sodium change at 4 hours/ });
    await user.type(input, "3.9");

    expect(screen.getByRole("heading", { name: "Repeat-dose branch reached" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Immediate repeat action" })).toBeInTheDocument();
    expect(screen.getByText(/Repeat 150 mL of 2.7% hypertonic saline/)).toBeInTheDocument();
  });

  it("labels the improved-symptoms result as cause management", async () => {
    const user = userEvent.setup();
    render(<HyponatraemiaEmergencyManagementReview />);

    await user.click(screen.getByRole("radio", { name: /High risk not confirmed/ }));
    await user.click(screen.getByRole("radio", { name: /^Symptoms improved/ }));

    expect(screen.getByText("Cause management")).toBeInTheDocument();
    expect(screen.getByText(/Diagnose and manage the cause/i)).toBeInTheDocument();
  });

  it("fails closed at an unstated boundary and clears downstream answers", async () => {
    const user = userEvent.setup();
    render(<HyponatraemiaEmergencyManagementReview />);

    await user.click(screen.getByRole("radio", { name: /High risk confirmed/ }));
    await user.click(screen.getByRole("radio", { name: /No symptomatic improvement/ }));
    const input = screen.getByRole("spinbutton", { name: /Sodium change at 4 hours/ });
    await user.type(input, "4");
    expect(
      screen.getByRole("note", { name: /No explicit source response branch/ }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("radio", { name: /High risk not confirmed/ }));
    expect(
      screen.queryByRole("spinbutton", { name: /Sodium change at 4 hours/ }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Confirm clinical response" })).toBeInTheDocument();
  });
});
