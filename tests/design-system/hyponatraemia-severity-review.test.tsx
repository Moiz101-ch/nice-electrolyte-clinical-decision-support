import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { HyponatraemiaSeverityReview } from "@/components/pathways/hyponatraemia/severity-review";

describe("hyponatraemia severity review", () => {
  it("automatically updates the classification from one sodium input", async () => {
    const user = userEvent.setup();
    render(<HyponatraemiaSeverityReview />);

    const input = screen.getByRole("spinbutton", { name: /Latest sodium result/i });
    expect(input).toHaveValue(129);
    expect(screen.getByRole("heading", { name: "Moderate hyponatraemia" })).toBeInTheDocument();

    await user.clear(input);
    await user.type(input, "124.9");
    expect(screen.getByRole("heading", { name: "Severe hyponatraemia" })).toBeInTheDocument();

    await user.clear(input);
    await user.type(input, "130");
    expect(screen.getByRole("heading", { name: "Mild hyponatraemia" })).toBeInTheDocument();
  });

  it("fails closed for an unstated decimal boundary and invalid precision", async () => {
    const user = userEvent.setup();
    render(<HyponatraemiaSeverityReview />);

    const input = screen.getByRole("spinbutton", { name: /Latest sodium result/i });
    await user.clear(input);
    await user.type(input, "129.5");
    expect(
      screen.getByRole("note", { name: /No exact source severity band matched/ }),
    ).toBeInTheDocument();

    await user.clear(input);
    await user.type(input, "124.99");
    expect(input).toBeInvalid();
    expect(input).toHaveAccessibleDescription(
      "Use the reported serum sodium value. Up to 1 decimal place is accepted. Enter sodium with no more than 1 decimal place.",
    );
  });
});
