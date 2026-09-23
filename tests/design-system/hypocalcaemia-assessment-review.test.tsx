import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { HypocalcaemiaAssessmentReview } from "@/components/pathways/hypocalcaemia/assessment-review";

describe("Hypocalcaemia assessment review", () => {
  it("progressively connects a severe symptomatic assessment to diagnostic review", async () => {
    const user = userEvent.setup();
    render(<HypocalcaemiaAssessmentReview />);

    expect(screen.queryByText("Source-listed symptoms and signs")).not.toBeInTheDocument();

    await user.type(
      screen.getByRole("spinbutton", { name: /Latest adjusted serum calcium result/i }),
      "1.85",
    );
    await user.click(screen.getByRole("radio", { name: /Adjustment confirmed/i }));

    expect(
      screen.getByRole("heading", { name: "Moderate/severe hypocalcaemia" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Source-listed symptoms and signs")).toBeInTheDocument();

    await user.click(screen.getByRole("checkbox", { name: "Seizures" }));
    expect(
      screen.getByRole("alert", { name: /Source-defined medical emergency/ }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("radio", { name: /Rapid fall confirmed/i }));
    expect(screen.getByText("Labelled placeholder")).toBeInTheDocument();
    await user.click(screen.getByRole("radio", { name: /No changes confirmed/i }));

    await user.selectOptions(screen.getByLabelText(/Serum magnesium/), "below-range");
    await user.selectOptions(screen.getByLabelText(/Renal function/), "no-renal-failure");
    await user.selectOptions(
      screen.getByLabelText(/Recent thyroid\/parathyroid surgery/),
      "no-recent-surgery",
    );

    expect(screen.getByText("Additional cause-investigation results")).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText(/Phosphate/), "low");
    await user.selectOptions(screen.getByLabelText(/Alkaline phosphatase/), "high");
    await user.selectOptions(screen.getByLabelText(/Parathyroid hormone/), "low");
    await user.selectOptions(screen.getByLabelText(/Vitamin D/), "deficient");

    expect(screen.getByRole("heading", { name: "Assessment inputs complete" })).toBeInTheDocument();
    expect(screen.getByText(/Low phosphate with high alkaline phosphatase/i)).toBeInTheDocument();
    expect(screen.getByText(/Low PTH in the presence of hypocalcaemia/i)).toBeInTheDocument();
    expect(screen.getByText("Assessment complete")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Severe symptomatic emergency management" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/Initially give 10 mL of 10% calcium gluconate/i),
    ).not.toBeInTheDocument();
    await clearCommonGuardrails(user);
    await user.click(
      within(
        screen.getByRole("group", { name: /Is hypoparathyroidism clinically confirmed/i }),
      ).getByRole("radio", { name: /Not confirmed/i }),
    );
    await user.click(
      within(
        screen.getByRole("group", {
          name: /Is vitamin D deficiency the clinically established cause/i,
        }),
      ).getByRole("radio", { name: /Not confirmed/i }),
    );
    await user.click(
      within(
        screen.getByRole("group", {
          name: /Is hypomagnesaemia clinically established as the cause/i,
        }),
      ).getByRole("radio", { name: /^Confirmed/i }),
    );
    await user.selectOptions(screen.getByLabelText(/Cardiac monitoring context/), "neither");
    expect(screen.getByRole("link", { name: /Review supporting-source limits/i })).toHaveAttribute(
      "href",
      "/review/hypomagnesaemia/supporting-guidance",
    );
    expect(
      screen.getByText(/cannot generate a magnesium treatment instruction/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Initially give 10 mL of 10% calcium gluconate/i)).toBeInTheDocument();
    expect(
      screen.getByRole("group", { name: /Have symptoms resolved after the initial treatment/i }),
    ).toBeInTheDocument();
    expect(screen.queryByText("YSTHFT-HYPOCALCAEMIA-V4")).not.toBeInTheDocument();
    expect(screen.queryByText(/page 1/i)).not.toBeInTheDocument();
  }, 15_000);

  it("preserves mutually exclusive symptom states and clears downstream answers", async () => {
    const user = userEvent.setup();
    render(<HypocalcaemiaAssessmentReview />);
    const calcium = screen.getByRole("spinbutton", {
      name: /Latest adjusted serum calcium result/i,
    });

    await user.type(calcium, "2.0");
    await user.click(screen.getByRole("radio", { name: /Adjustment confirmed/i }));
    const none = screen.getByRole("checkbox", { name: "None of the listed findings confirmed" });
    const weakness = screen.getByRole("checkbox", { name: "Weakness" });
    await user.click(none);
    expect(none).toBeChecked();
    await user.click(weakness);
    expect(weakness).toBeChecked();
    expect(none).not.toBeChecked();

    await user.click(screen.getByRole("radio", { name: /Not confirmed/i }));
    await user.click(screen.getByRole("radio", { name: /No changes confirmed/i }));
    expect(screen.getByText("Diagnostic context")).toBeInTheDocument();

    await user.clear(calcium);
    await user.type(calcium, "2.15");
    expect(screen.queryByText("Diagnostic context")).not.toBeInTheDocument();
    await user.click(screen.getByRole("radio", { name: /Adjustment confirmed/i }));
    expect(screen.getByText("Unclassified source boundary")).toBeInTheDocument();
    expect(screen.queryByText("Source-listed symptoms and signs")).not.toBeInTheDocument();
  });

  it("completes the shorter recent-surgery branch", async () => {
    const user = userEvent.setup();
    render(<HypocalcaemiaAssessmentReview />);

    await user.type(
      screen.getByRole("spinbutton", { name: /Latest adjusted serum calcium result/i }),
      "2.0",
    );
    await user.click(screen.getByRole("radio", { name: /Adjustment confirmed/i }));
    await user.click(
      screen.getByRole("checkbox", { name: "None of the listed findings confirmed" }),
    );
    await user.click(screen.getByRole("radio", { name: /Not confirmed/i }));
    await user.click(screen.getByRole("radio", { name: /No changes confirmed/i }));
    await user.selectOptions(screen.getByLabelText(/Serum magnesium/), "not-below-range");
    await user.selectOptions(screen.getByLabelText(/Renal function/), "no-renal-failure");
    await user.selectOptions(
      screen.getByLabelText(/Recent thyroid\/parathyroid surgery/),
      "recent-surgery",
    );

    expect(screen.queryByText("Additional cause-investigation results")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Assessment inputs complete" })).toBeInTheDocument();
    expect(
      screen.getByText(/Recent thyroid or parathyroid surgery is confirmed/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Mild asymptomatic management" }),
    ).toBeInTheDocument();
    await clearCommonGuardrails(user);
    await user.selectOptions(screen.getByLabelText(/Detailed surgery context/), "thyroidectomy");
    await user.click(
      within(
        screen.getByRole("group", { name: /Is hypoparathyroidism clinically confirmed/i }),
      ).getByRole("radio", { name: /Not confirmed/i }),
    );
    await user.click(
      within(
        screen.getByRole("group", {
          name: /Is vitamin D deficiency the clinically established cause/i,
        }),
      ).getByRole("radio", { name: /Not confirmed/i }),
    );
    await user.click(screen.getByRole("radio", { name: /Calcichew Forte/i }));
    expect(screen.getByText("24 hours later")).toBeInTheDocument();
    expect(
      screen.getByRole("spinbutton", { name: /Follow-up adjusted serum calcium/i }),
    ).toBeInTheDocument();
  }, 20_000);
});

async function clearCommonGuardrails(user: ReturnType<typeof userEvent.setup>) {
  await user.click(
    within(
      screen.getByRole("group", {
        name: /Is this hypocalcaemia associated with a recent blood transfusion/i,
      }),
    ).getByRole("radio", { name: /Not confirmed/i }),
  );
  await user.click(
    within(
      screen.getByRole("group", { name: /Is rhabdomyolysis clinically confirmed/i }),
    ).getByRole("radio", { name: /Not confirmed/i }),
  );
  await user.click(
    within(
      screen.getByRole("group", { name: /Is acute pancreatitis clinically confirmed/i }),
    ).getByRole("radio", { name: /Not confirmed/i }),
  );
  await user.click(
    screen.getByRole("checkbox", { name: "None of the listed medicines confirmed" }),
  );
}
