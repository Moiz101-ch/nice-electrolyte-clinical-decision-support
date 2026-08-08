import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { AssessmentWorkflow } from "@/components/assessment/assessment-workflow";

describe("structured assessment workflow", () => {
  it("shows inline schema errors and keeps the user on the invalid step", async () => {
    const user = userEvent.setup();

    render(<AssessmentWorkflow />);

    await user.click(screen.getByRole("button", { name: "Continue" }));

    expect(screen.getByText("Select an electrolyte.")).toBeInTheDocument();
    expect(screen.getByText("Step 1 of 5")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Potassium/ }));
    await user.click(screen.getByRole("button", { name: "Hyperkalaemia" }));
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.type(screen.getByRole("spinbutton", { name: /Age \(years\)/ }), "15.5");
    await user.type(screen.getByRole("spinbutton", { name: /Latest potassium result/i }), "-1");
    await user.click(screen.getByRole("button", { name: "Continue" }));

    expect(screen.getByText("Enter a whole number.")).toBeInTheDocument();
    expect(screen.getByText("The result cannot be negative.")).toBeInTheDocument();
    expect(screen.getByText("Select pregnancy status.")).toBeInTheDocument();
    expect(screen.getByText("Step 2 of 5")).toBeInTheDocument();
  });

  it("stops a contradictory abnormality and electrolyte value before context selection", async () => {
    const user = userEvent.setup();

    render(<AssessmentWorkflow />);
    await user.click(screen.getByRole("button", { name: /Sodium/ }));
    await user.click(screen.getByRole("button", { name: "Hypernatraemia" }));
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.type(screen.getByRole("spinbutton", { name: /Age \(years\)/ }), "80");
    await user.type(screen.getByRole("spinbutton", { name: /Latest sodium result/i }), "102");
    await user.selectOptions(screen.getByLabelText(/Pregnancy status/), "not-pregnant");
    await user.click(screen.getByRole("button", { name: "Continue" }));

    expect(screen.getByText(/does not match Hypernatraemia/i)).toBeInTheDocument();
    expect(screen.getByText(/reference interval requires above 145 mmol\/L/i)).toBeInTheDocument();
    expect(screen.getByText("Step 2 of 5")).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Select the clinical context" }),
    ).not.toBeInTheDocument();
  });

  it("preserves editable data and produces a complete supported result", async () => {
    const user = userEvent.setup();

    render(<AssessmentWorkflow />);
    await completeIvHyponatraemiaToReview(user);

    expect(screen.getByRole("heading", { name: "Review and confirm" })).toBeInTheDocument();
    expect(screen.getAllByText("129.9 mmol/L").length).toBeGreaterThan(0);
    expect(screen.getAllByText("IV-fluid related").length).toBeGreaterThan(0);

    await user.click(
      screen.getByRole("checkbox", {
        name: /I confirm this structured information has been reviewed/i,
      }),
    );
    await user.click(screen.getByRole("button", { name: "Generate result" }));

    expect(
      screen.getByRole("heading", { name: "NICE detection, reassessment and escalation" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Information used" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "NICE-derived result" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Why this rule matched" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Missing information" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Limitations and safety" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Exact NICE source" })).toBeInTheDocument();
    expect(screen.getByText("NICE-NA-HYPO-IV-001")).toBeInTheDocument();
    expect(screen.getByText(/Reassess the IV-fluid management plan/i)).toBeInTheDocument();
    expect(screen.getByText("NICE CG174")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Open NICE guidance/i })).toHaveAttribute(
      "href",
      "https://www.nice.org.uk/guidance/cg174/chapter/Recommendations",
    );
    expect(screen.getByText(/No definitive sodium-correction regimen/i)).toBeInTheDocument();

    await user.click(screen.getAllByRole("button", { name: "Edit assessment" })[0]!);
    await user.click(screen.getByRole("button", { name: "Edit basic details" }));

    expect(screen.getByRole("spinbutton", { name: /Age \(years\)/ })).toHaveValue(74);
    expect(screen.getByRole("spinbutton", { name: /Latest sodium result/i })).toHaveValue(129.9);
    expect(screen.queryByText("NICE-NA-HYPO-IV-001")).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Step 4: Complete context-specific fields" }),
    );
    expect(screen.getByRole("spinbutton", { name: /Baseline sodium/i })).toHaveValue(138);
    expect(
      within(screen.getByRole("group", { name: "Receiving IV fluids" })).getByLabelText("Yes"),
    ).toBeChecked();
  });

  it("passes an explicit not-confirmed answer to the engine as missing evidence", async () => {
    const user = userEvent.setup();

    render(<AssessmentWorkflow />);
    await completeIvHyponatraemiaToReview(user, "unknown");
    await user.click(
      screen.getByRole("checkbox", {
        name: /I confirm this structured information has been reviewed/i,
      }),
    );
    await user.click(screen.getByRole("button", { name: "Generate result" }));

    expect(screen.getByRole("heading", { name: "Assessment blocked safely" })).toBeInTheDocument();
    expect(screen.getByText("Missing confirmation")).toBeInTheDocument();
    expect(screen.getByText(/context\.alternativeCauseIdentified/)).toBeInTheDocument();
    expect(screen.queryByText(/Reassess the IV-fluid management plan/i)).not.toBeInTheDocument();
  });

  it("routes a pregnant adult assessment to an out-of-scope safety result", async () => {
    const user = userEvent.setup();

    render(<AssessmentWorkflow />);
    await user.click(screen.getByRole("button", { name: /Sodium/ }));
    await user.click(screen.getByRole("button", { name: "Hyponatraemia" }));
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.type(screen.getByRole("spinbutton", { name: /Age \(years\)/ }), "31");
    await user.type(screen.getByRole("spinbutton", { name: /Latest sodium result/i }), "126");
    await user.selectOptions(screen.getByLabelText(/Pregnancy status/), "pregnant");

    expect(screen.getByText("Outside this prototype's scope")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByRole("button", { name: /General adult presentation/ }));
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(
      screen.getByRole("checkbox", {
        name: /I confirm this structured information has been reviewed/i,
      }),
    );
    await user.click(screen.getByRole("button", { name: "Generate result" }));

    expect(screen.getByRole("heading", { name: "Assessment blocked safely" })).toBeInTheDocument();
    expect(screen.getByText("Outside scope")).toBeInTheDocument();
    expect(screen.getAllByText(/pregnancy-specific pathway/i)).toHaveLength(2);
  });

  it("shows NICE binder options only alongside confirmed standard emergency care", async () => {
    const user = userEvent.setup();

    render(<AssessmentWorkflow />);
    await user.click(screen.getByRole("button", { name: /Potassium/ }));
    await user.click(screen.getByRole("button", { name: "Hyperkalaemia" }));
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.type(screen.getByRole("spinbutton", { name: /Age \(years\)/ }), "68");
    await user.type(screen.getByRole("spinbutton", { name: /Latest potassium result/i }), "6.8");
    await user.selectOptions(screen.getByLabelText(/Pregnancy status/), "not-applicable");
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByRole("button", { name: /Acute life-threatening hyperkalaemia/ }));
    await user.click(screen.getByRole("button", { name: "Continue" }));

    for (const groupName of [
      "Acute life-threatening hyperkalaemia confirmed",
      "Currently in emergency care",
      "Standard emergency care underway",
    ]) {
      await user.click(
        within(screen.getByRole("group", { name: groupName })).getByLabelText("Yes"),
      );
    }

    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(
      screen.getByRole("checkbox", {
        name: /I confirm this structured information has been reviewed/i,
      }),
    );
    await user.click(screen.getByRole("button", { name: "Generate result" }));

    expect(
      screen.getByRole("heading", { name: "NICE emergency-care medicine options" }),
    ).toBeInTheDocument();
    expect(screen.getByText("NICE-K-ACUTE-BINDER-OPTIONS-001")).toBeInTheDocument();
    expect(screen.getByText(/only alongside standard care in emergency care/i)).toBeInTheDocument();
    expect(screen.getByText("NICE TA1148")).toBeInTheDocument();
    expect(screen.getByText("NICE TA623")).toBeInTheDocument();
  });

  it("renders a clearly separated unsupported result without treatment instructions", async () => {
    const user = userEvent.setup();

    render(<AssessmentWorkflow />);
    await user.click(screen.getByRole("button", { name: /Magnesium/ }));
    await user.click(screen.getByRole("button", { name: "Hypomagnesaemia" }));
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.type(screen.getByRole("spinbutton", { name: /Age \(years\)/ }), "62");
    await user.type(screen.getByRole("spinbutton", { name: /Latest magnesium result/i }), "0.5");
    await user.selectOptions(screen.getByLabelText(/Pregnancy status/), "not-applicable");
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByRole("button", { name: /General adult presentation/ }));
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(
      screen.getByRole("checkbox", {
        name: /I confirm this structured information has been reviewed/i,
      }),
    );
    await user.click(screen.getByRole("button", { name: "Generate result" }));

    expect(
      screen.getByRole("heading", { name: "No definitive NICE-only management output" }),
    ).toBeInTheDocument();
    expect(screen.getByText("NICE-UNSUPPORTED-001")).toBeInTheDocument();
    expect(screen.getByText("No treatment source attached")).toBeInTheDocument();
    expect(
      screen.getByText(/approved local protocol or seek specialist review/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Do not generate treatment instructions/i)).toBeInTheDocument();
    expect(screen.queryByText(/replacement dose/i)).not.toBeInTheDocument();
  });
});

async function completeIvHyponatraemiaToReview(
  user: ReturnType<typeof userEvent.setup>,
  alternativeCause: "no" | "unknown" = "no",
) {
  await user.click(screen.getByRole("button", { name: /Sodium/ }));
  await user.click(screen.getByRole("button", { name: "Hyponatraemia" }));
  await user.click(screen.getByRole("button", { name: "Continue" }));

  await user.type(screen.getByRole("spinbutton", { name: /Age \(years\)/ }), "74");
  await user.type(screen.getByRole("spinbutton", { name: /Latest sodium result/i }), "129.9");
  await user.selectOptions(screen.getByLabelText(/Pregnancy status/), "not-applicable");
  await user.click(screen.getByRole("button", { name: "Continue" }));

  await user.click(screen.getByRole("button", { name: /IV-fluid related/ }));
  await user.click(screen.getByRole("button", { name: "Continue" }));

  await user.type(screen.getByRole("spinbutton", { name: /Baseline sodium/i }), "138");
  await user.click(
    within(screen.getByRole("group", { name: "Receiving IV fluids" })).getByLabelText("Yes"),
  );
  await user.click(
    within(screen.getByRole("group", { name: "Temporal relationship confirmed" })).getByLabelText(
      "Yes",
    ),
  );
  await user.click(
    within(screen.getByRole("group", { name: "IV-fluid prescription reviewed" })).getByLabelText(
      "Yes",
    ),
  );
  await user.selectOptions(screen.getByLabelText(/Fluid status/), "hypervolaemic");
  await user.type(screen.getByRole("spinbutton", { name: /eGFR/i }), "64");
  await user.click(
    within(screen.getByRole("group", { name: "Alternative cause identified" })).getByLabelText(
      alternativeCause === "no" ? "No" : "Not confirmed",
    ),
  );
  await user.click(screen.getByRole("button", { name: "Continue" }));
}
