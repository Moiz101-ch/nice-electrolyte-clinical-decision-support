import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { HyperkalaemiaEcgWorkflowReview } from "@/components/pathways/hyperkalaemia/ecg-workflow-review";

describe("Hyperkalaemia ECG workflow review", () => {
  it("reveals the six ECG labels only when the potassium branch requires them", async () => {
    const user = userEvent.setup();
    render(<HyperkalaemiaEcgWorkflowReview />);

    const input = screen.getByRole("spinbutton", { name: /Latest potassium result/i });
    expect(input).toHaveValue(6);
    expect(screen.getByRole("heading", { name: "Moderate hyperkalaemia" })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Source-listed ECG changes" })).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Peaked T waves" })).toBeInTheDocument();
    expect(
      screen.getByRole("checkbox", { name: "Ventricular tachycardia (VT)" }),
    ).toBeInTheDocument();

    await user.clear(input);
    await user.type(input, "5.9");
    expect(screen.getByRole("heading", { name: "Mild hyperkalaemia" })).toBeInTheDocument();
    expect(
      screen.queryByRole("group", { name: "Source-listed ECG changes" }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("ECG selector not triggered")).toBeInTheDocument();
  });

  it("routes one or more confirmed ECG changes to the escalation endpoint", async () => {
    const user = userEvent.setup();
    render(<HyperkalaemiaEcgWorkflowReview />);

    await user.click(screen.getByRole("checkbox", { name: "Peaked T waves" }));
    await user.click(screen.getByRole("checkbox", { name: "Broad QRS" }));

    expect(screen.getByRole("heading", { name: "ECG changes confirmed" })).toBeInTheDocument();
    expect(screen.getByText("Confirmed: Peaked T waves, Broad QRS.")).toBeInTheDocument();
    expect(
      screen.getByText("Use cardiac monitoring and resuscitation support."),
    ).toBeInTheDocument();
    expect(screen.getByText("Consider referral to outreach.")).toBeInTheDocument();
  });

  it("keeps no-change and uncertainty states exclusive from clinical labels", async () => {
    const user = userEvent.setup();
    render(<HyperkalaemiaEcgWorkflowReview />);

    const peaked = screen.getByRole("checkbox", { name: "Peaked T waves" });
    const none = screen.getByRole("checkbox", {
      name: "None of the listed ECG changes confirmed",
    });
    const unable = screen.getByRole("checkbox", { name: "Unable to determine safely" });

    await user.click(peaked);
    await user.click(none);
    expect(peaked).not.toBeChecked();
    expect(none).toBeChecked();
    expect(
      screen.getByRole("heading", { name: "No listed ECG changes confirmed" }),
    ).toBeInTheDocument();

    await user.click(unable);
    expect(none).not.toBeChecked();
    expect(unable).toBeChecked();
    expect(screen.getByText("ECG assessment requires review")).toBeInTheDocument();

    await user.click(peaked);
    expect(unable).not.toBeChecked();
    expect(peaked).toBeChecked();
    expect(screen.getByRole("heading", { name: "ECG changes confirmed" })).toBeInTheDocument();
  });

  it("clears downstream ECG state whenever potassium changes", async () => {
    const user = userEvent.setup();
    render(<HyperkalaemiaEcgWorkflowReview />);

    const input = screen.getByRole("spinbutton", { name: /Latest potassium result/i });
    await user.click(screen.getByRole("checkbox", { name: "Sine wave" }));
    expect(screen.getByRole("heading", { name: "ECG changes confirmed" })).toBeInTheDocument();

    await user.clear(input);
    await user.type(input, "6.5");
    expect(screen.getByRole("checkbox", { name: "Sine wave" })).not.toBeChecked();
    expect(screen.getByText("Confirm ECG findings")).toBeInTheDocument();
  });

  it("preserves the urgent safeguard at 7.0 while awaiting ECG input", async () => {
    const user = userEvent.setup();
    render(<HyperkalaemiaEcgWorkflowReview />);

    const input = screen.getByRole("spinbutton", { name: /Latest potassium result/i });
    await user.clear(input);
    await user.type(input, "7.0");

    expect(screen.getByRole("alert", { name: /Urgent source safeguard/ })).toBeInTheDocument();
    expect(screen.getByText("Confirm ECG findings")).toBeInTheDocument();
    expect(screen.queryByText("YSTHFT-ACUTE-HYPERKALAEMIA-V1")).not.toBeInTheDocument();
  });
});
