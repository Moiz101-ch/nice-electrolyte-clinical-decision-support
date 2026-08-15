import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { HyponatraemiaConnectedAssessmentReview } from "@/components/pathways/hyponatraemia/connected-assessment-review";

async function reachEmergencyStage(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByRole("spinbutton", { name: /Latest sodium result/ }), "124");
  await user.click(screen.getByRole("button", { name: "Continue" }));
  await user.click(screen.getByRole("radio", { name: /Euvolaemic/ }));
  await user.click(screen.getByRole("checkbox", { name: "Confusion" }));
  await user.click(screen.getByRole("button", { name: "Continue" }));
}

describe("connected Hyponatraemia assessment review", () => {
  it("carries one complete emergency and classification example into a dynamic result", async () => {
    const user = userEvent.setup();
    render(<HyponatraemiaConnectedAssessmentReview />);

    expect(screen.getByRole("heading", { name: "Confirm sodium result" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();

    await reachEmergencyStage(user);
    expect(
      screen.getByRole("heading", { name: "Complete emergency follow-up" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/150 mL of 2.7% hypertonic saline/)).toBeInTheDocument();

    await user.click(screen.getByRole("radio", { name: /High risk confirmed/ }));
    expect(screen.getByRole("heading", { name: "Monitoring" })).toBeInTheDocument();
    await user.click(screen.getByRole("radio", { name: /^Symptoms improved/ }));
    expect(
      screen.getByRole("heading", { name: "Emergency response recorded" }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Continue" }));

    expect(
      screen.getByRole("heading", { name: "Complete laboratory classification" }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("radio", { name: /Yes - results available/ }));
    await user.type(screen.getByRole("spinbutton", { name: /Serum osmolality/ }), "270");
    await user.type(screen.getByRole("spinbutton", { name: /^Urine osmolality/ }), "120");
    await user.type(screen.getByRole("spinbutton", { name: /^Urine sodium/ }), "40.1");
    expect(screen.getByRole("heading", { name: "SIADH-compatible pattern" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Review result" }));
    expect(screen.getByText("Connected assessment result")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Severe hyponatraemia" })).toBeInTheDocument();
    expect(
      screen.getByText("Symptomatic emergency management", { exact: true }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Sodium 124 mmol\/L selected Severe hyponatraemia/),
    ).toBeInTheDocument();
  }, 15_000);

  it("removes the emergency stage and stale emergency answers when context changes", async () => {
    const user = userEvent.setup();
    render(<HyponatraemiaConnectedAssessmentReview />);

    await reachEmergencyStage(user);
    await user.click(screen.getByRole("radio", { name: /High risk confirmed/ }));
    await user.click(screen.getByRole("radio", { name: /^Symptoms improved/ }));
    await user.click(screen.getByRole("button", { name: "Back" }));
    await user.click(screen.getByRole("checkbox", { name: "None of the listed signs confirmed" }));

    expect(screen.queryByText("Emergency follow-up", { exact: true })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Continue" }));
    expect(
      screen.getByRole("heading", { name: "Complete laboratory classification" }),
    ).toBeInTheDocument();
  });

  it("requires a confirmed euvolaemic cause before generating cause-specific management", async () => {
    const user = userEvent.setup();
    render(<HyponatraemiaConnectedAssessmentReview />);

    await user.type(screen.getByRole("spinbutton", { name: /Latest sodium result/ }), "129");
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByRole("radio", { name: /Euvolaemic/ }));
    await user.click(screen.getByRole("checkbox", { name: "None of the listed signs confirmed" }));
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByRole("radio", { name: /No - not available/ }));
    await user.click(screen.getByRole("button", { name: "Continue" }));

    expect(
      screen.getByRole("heading", { name: "Complete euvolaemic cause review" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Review result" })).toBeDisabled();

    await user.click(screen.getByRole("radio", { name: /Water intoxication established/ }));
    expect(screen.getByText("Use fluid restriction and obtain consultant review.")).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Review result" }));

    expect(
      screen.getByText("Euvolaemic water-intoxication management", { exact: true }),
    ).toBeVisible();
    expect(screen.getByRole("heading", { name: "Fluid restriction" })).toBeVisible();
  });

  it("confirms before clearing all in-memory answers", async () => {
    const user = userEvent.setup();
    render(<HyponatraemiaConnectedAssessmentReview />);
    const input = screen.getByRole("spinbutton", { name: /Latest sodium result/ });

    await user.type(input, "129");
    await user.click(screen.getByRole("button", { name: "Start over" }));
    expect(screen.getByRole("dialog", { name: "Start assessment again?" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Clear assessment" }));

    expect(input).toHaveValue(null);
    expect(screen.getByRole("heading", { name: "Confirm sodium result" })).toBeInTheDocument();
  });

  it("does not display internal document references", () => {
    const { container } = render(<HyponatraemiaConnectedAssessmentReview />);

    expect(container.textContent).not.toMatch(
      /YSTHFT-|UNVERIFIED-HYPONATRAEMIA|Registry ID|Mapped location|Page 1|Reference:|\.pdf/i,
    );
  });
});
