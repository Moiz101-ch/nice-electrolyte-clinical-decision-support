import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { HyperkalaemiaTimedManagementReview } from "@/components/pathways/hyperkalaemia/timed-management-review";

describe("Hyperkalaemia timed management review", () => {
  it("progressively reveals severe treatment inputs and a complete management output", async () => {
    const user = userEvent.setup();
    render(<HyperkalaemiaTimedManagementReview />);

    const potassium = screen.getByRole("spinbutton", { name: /Latest potassium result/i });
    expect(potassium).toHaveValue(null);
    expect(screen.getByText("Awaiting potassium result")).toBeInTheDocument();
    await user.type(potassium, "6.5");

    expect(screen.getByRole("heading", { name: "Severe hyperkalaemia" })).toBeInTheDocument();
    expect(screen.getByText("How to exclude pseudohyperkalaemia")).toBeInTheDocument();
    expect(screen.getByText(/paired samples from a large vein/i)).toBeInTheDocument();
    expect(screen.getByText(/more than 0\.4 mmol\/L higher than plasma/i)).toBeInTheDocument();
    expect(
      screen.getByText(/normal ECG.*does not exclude true hyperkalaemia/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/venous blood gas \(VBG\)/i)).toBeInTheDocument();
    expect(screen.getByText("Unapproved schematic ECG references")).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Source-listed ECG changes" })).toBeInTheDocument();
    expect(screen.getAllByTestId(/^ecg-waveform-/)).toHaveLength(6);
    expect(
      screen.queryByRole("spinbutton", { name: /Confirmed pre-treatment blood glucose/i }),
    ).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("checkbox", { name: "None of the listed ECG changes confirmed" }),
    );
    const glucose = screen.getByRole("spinbutton", {
      name: /Confirmed pre-treatment blood glucose/i,
    });
    expect(glucose).toBeInTheDocument();

    await user.type(glucose, "6.9");
    expect(
      screen.getByRole("group", { name: /Which source-listed salbutamol context applies?/i }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("radio", { name: /No listed caution confirmed/i }));

    expect(
      screen.getByRole("heading", { name: "Connected management output" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Give 6 units of soluble insulin \(Actrapid\)/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Because pre-treatment blood glucose is below 7.0/i),
    ).toBeInTheDocument();
    expect(screen.queryByText("Conflicting sodium-zirconium criteria")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Ongoing monitoring" })).toBeInTheDocument();
    expect(screen.getByText("Cause and recurrence prevention")).toBeInTheDocument();
  });

  it("requires digoxin context before selecting a calcium duration", async () => {
    const user = userEvent.setup();
    render(<HyperkalaemiaTimedManagementReview />);

    await user.type(screen.getByRole("spinbutton", { name: /Latest potassium result/i }), "6.5");
    await user.click(screen.getByRole("checkbox", { name: "Peaked T waves" }));
    expect(
      screen.getByRole("group", { name: /Is there concern about digoxin toxicity?/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("spinbutton", { name: /Confirmed pre-treatment blood glucose/i }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("radio", { name: /Concern not confirmed/i }));
    expect(
      screen.getByRole("spinbutton", { name: /Confirmed pre-treatment blood glucose/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Administer 30 mL of intravenous calcium gluconate 10%/i),
    ).toBeInTheDocument();
  });

  it("keeps ECG no-change and uncertainty states mutually exclusive", async () => {
    const user = userEvent.setup();
    render(<HyperkalaemiaTimedManagementReview />);

    await user.type(screen.getByRole("spinbutton", { name: /Latest potassium result/i }), "6.5");
    const peaked = screen.getByRole("checkbox", { name: "Peaked T waves" });
    const none = screen.getByRole("checkbox", {
      name: "None of the listed ECG changes confirmed",
    });
    const unable = screen.getByRole("checkbox", { name: "Unable to determine safely" });

    await user.click(peaked);
    await user.click(none);
    expect(peaked).not.toBeChecked();
    expect(none).toBeChecked();

    await user.click(unable);
    expect(none).not.toBeChecked();
    expect(unable).toBeChecked();
    expect(screen.getByText("Urgent ECG review required")).toBeInTheDocument();
  });

  it("preserves the 7.0 safeguard and requires calcium context when ECG is uncertain", async () => {
    const user = userEvent.setup();
    render(<HyperkalaemiaTimedManagementReview />);
    const potassium = screen.getByRole("spinbutton", { name: /Latest potassium result/i });

    await user.type(potassium, "7.0");
    expect(screen.getByRole("alert", { name: /Urgent threshold safeguard/ })).toBeInTheDocument();

    await user.click(screen.getByRole("checkbox", { name: "Unable to determine safely" }));
    expect(
      screen.getByRole("group", { name: /Is there concern about digoxin toxicity?/i }),
    ).toBeInTheDocument();
  });

  it("clears every downstream answer when potassium changes", async () => {
    const user = userEvent.setup();
    render(<HyperkalaemiaTimedManagementReview />);
    const potassium = screen.getByRole("spinbutton", { name: /Latest potassium result/i });

    await user.type(potassium, "6.5");
    await user.click(screen.getByRole("checkbox", { name: "Broad QRS" }));
    await user.click(screen.getByRole("radio", { name: /Concern not confirmed/i }));
    const glucose = screen.getByRole("spinbutton", {
      name: /Confirmed pre-treatment blood glucose/i,
    });
    await user.type(glucose, "7");
    await user.click(screen.getByRole("radio", { name: /No listed caution confirmed/i }));

    await user.clear(potassium);
    await user.type(potassium, "5.9");

    expect(
      screen.queryByRole("group", { name: "Source-listed ECG changes" }),
    ).not.toBeInTheDocument();
    expect(screen.queryAllByTestId(/^ecg-waveform-/)).toHaveLength(0);
    expect(
      screen.queryByRole("spinbutton", { name: /Confirmed pre-treatment blood glucose/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("ECG selector not triggered")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Ongoing monitoring" })).toBeInTheDocument();
  });
});
