import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { HyperkalaemiaSeverityReview } from "@/components/pathways/hyperkalaemia/severity-review";

describe("Hyperkalaemia severity review", () => {
  it("automatically updates severity and conditional initial checks", async () => {
    const user = userEvent.setup();
    render(<HyperkalaemiaSeverityReview />);

    const input = screen.getByRole("spinbutton", { name: /Latest potassium result/i });
    expect(input).toHaveValue(6);
    expect(screen.getByRole("heading", { name: "Moderate hyperkalaemia" })).toBeInTheDocument();
    expect(
      screen.getByText("Perform a 12-lead ECG and monitor cardiac rhythm."),
    ).toBeInTheDocument();

    await user.clear(input);
    await user.type(input, "5.5");
    expect(screen.getByRole("heading", { name: "Mild hyperkalaemia" })).toBeInTheDocument();
    expect(
      screen.queryByText("Perform a 12-lead ECG and monitor cardiac rhythm."),
    ).not.toBeInTheDocument();

    await user.clear(input);
    await user.type(input, "6.5");
    expect(screen.getByRole("heading", { name: "Severe hyperkalaemia" })).toBeInTheDocument();
    expect(
      screen.getByText("Perform a 12-lead ECG and monitor cardiac rhythm."),
    ).toBeInTheDocument();
  });

  it("shows the urgent safeguard at 7.0 without displaying internal references", async () => {
    const user = userEvent.setup();
    render(<HyperkalaemiaSeverityReview />);

    const input = screen.getByRole("spinbutton", { name: /Latest potassium result/i });
    await user.clear(input);
    await user.type(input, "7.0");

    expect(screen.getByRole("alert", { name: /Urgent source safeguard/ })).toBeInTheDocument();
    expect(screen.getByText(/do not delay administering calcium gluconate/i)).toBeInTheDocument();
    expect(screen.queryByText("YSTHFT-ACUTE-HYPERKALAEMIA-V1")).not.toBeInTheDocument();
    expect(screen.queryByText(/page 2/i)).not.toBeInTheDocument();
  });

  it("fails closed for source gaps and exposes precision errors accessibly", async () => {
    const user = userEvent.setup();
    render(<HyperkalaemiaSeverityReview />);

    const input = screen.getByRole("spinbutton", { name: /Latest potassium result/i });
    await user.clear(input);
    await user.type(input, "5.99");
    expect(
      screen.getByRole("note", { name: /No exact source severity band matched/ }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /hyperkalaemia$/i })).not.toBeInTheDocument();

    await user.clear(input);
    await user.type(input, "5.499");
    expect(input).toBeInvalid();
    expect(input).toHaveAccessibleDescription(
      "Use the reported serum potassium value. Up to 2 decimal places is accepted; values are not rounded into a severity band. Enter potassium with no more than 2 decimal places.",
    );
  });
});
