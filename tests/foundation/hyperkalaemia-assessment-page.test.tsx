import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import HyperkalaemiaAssessmentPage, { metadata } from "@/app/review/hyperkalaemia/assessment/page";

describe("Hyperkalaemia timed management page", () => {
  it("advances connected progress and preserves the source-conflict boundary", async () => {
    const user = userEvent.setup();
    render(<HyperkalaemiaAssessmentPage />);

    expect(metadata.title).toBe("Hyperkalaemia timed management review");
    expect(
      screen.getByRole("heading", { name: "Hyperkalaemia timed management" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Unapproved treatment preview - do not use clinically"),
    ).toBeInTheDocument();
    const progress = screen.getByRole("navigation", { name: "Assessment progress" });
    expect(within(progress).getByText("Potassium result").closest("li")).toHaveAttribute(
      "aria-current",
      "step",
    );
    expect(screen.queryByText("Unapproved schematic ECG references")).not.toBeInTheDocument();

    await user.type(screen.getByRole("spinbutton", { name: /Latest potassium result/i }), "6.5");
    await waitFor(() =>
      expect(within(progress).getByText("ECG review").closest("li")).toHaveAttribute(
        "aria-current",
        "step",
      ),
    );
    expect(screen.getByText("Unapproved schematic ECG references")).toBeInTheDocument();

    await user.click(
      screen.getByRole("checkbox", { name: "None of the listed ECG changes confirmed" }),
    );
    await waitFor(() =>
      expect(within(progress).getByText("Timed management").closest("li")).toHaveAttribute(
        "aria-current",
        "step",
      ),
    );
    expect(screen.getByText("Clinical review pending")).toBeInTheDocument();
    expect(screen.queryByText("Source conflict held")).not.toBeInTheDocument();
    expect(screen.queryByText("Conflicting sodium-zirconium criteria")).not.toBeInTheDocument();
    expect(screen.getByText("Pathway v0.3.0")).toBeInTheDocument();
    expect(screen.queryByText("YSTHFT-ACUTE-HYPERKALAEMIA-V1")).not.toBeInTheDocument();
    expect(screen.queryByText(/page 2/i)).not.toBeInTheDocument();
  });

  it("marks ECG as skipped when a mild result does not require it", async () => {
    const user = userEvent.setup();
    render(<HyperkalaemiaAssessmentPage />);
    const progress = screen.getByRole("navigation", { name: "Assessment progress" });

    await user.type(screen.getByRole("spinbutton", { name: /Latest potassium result/i }), "5.9");

    await waitFor(() =>
      expect(within(progress).getByText("Timed management").closest("li")).toHaveAttribute(
        "aria-current",
        "step",
      ),
    );
    expect(within(progress).getByText("ECG review").closest("li")).toHaveTextContent(
      "Not required for mild resultStatus: skipped",
    );
    expect(screen.queryByText("Unapproved schematic ECG references")).not.toBeInTheDocument();
  });
});
