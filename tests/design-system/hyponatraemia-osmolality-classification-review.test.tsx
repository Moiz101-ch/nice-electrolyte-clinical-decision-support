import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { HyponatraemiaOsmolalityClassificationReview } from "@/components/pathways/hyponatraemia/osmolality-classification-review";

describe("hyponatraemia osmolality-classification review", () => {
  it("starts with no clinical option selected and no visible document reference", () => {
    render(<HyponatraemiaOsmolalityClassificationReview />);

    expect(screen.getByRole("note", { name: /Required exclusion checks/ })).toBeInTheDocument();
    expect(screen.getAllByRole("radio")).toHaveLength(2);
    expect(screen.queryByRole("spinbutton")).not.toBeInTheDocument();
    expect(screen.queryByText(/Page 1|Registry ID|YSTHFT-/i)).not.toBeInTheDocument();
  });

  it("keeps emergency review available when urine results are unavailable", async () => {
    const user = userEvent.setup();
    render(<HyponatraemiaOsmolalityClassificationReview />);

    await user.click(screen.getByRole("radio", { name: /No - not available/i }));

    expect(screen.getByRole("heading", { name: "Urine results unavailable" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Open emergency review/ })).toHaveAttribute(
      "href",
      "/review/hyponatraemia/emergency-management",
    );
    expect(screen.queryByRole("spinbutton")).not.toBeInTheDocument();
  });

  it("shows an isotonic compatible category without requesting fluid or urine values", async () => {
    const user = userEvent.setup();
    render(<HyponatraemiaOsmolalityClassificationReview />);

    await user.click(screen.getByRole("radio", { name: /Yes - results available/i }));
    await user.type(screen.getByRole("spinbutton", { name: /Serum osmolality/ }), "280");

    expect(
      screen.getByRole("heading", { name: "Pseudohyponatraemia-compatible pattern" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Paraproteinaemia")).toBeInTheDocument();
    expect(screen.queryByRole("group", { name: /Confirm fluid status/ })).not.toBeInTheDocument();
  });

  it("reaches the guarded SIADH-compatible endpoint through the euvolaemic branch", async () => {
    const user = userEvent.setup();
    render(<HyponatraemiaOsmolalityClassificationReview />);

    await user.click(screen.getByRole("radio", { name: /Yes - results available/i }));
    await user.type(screen.getByRole("spinbutton", { name: /Serum osmolality/ }), "270");
    await user.click(screen.getByRole("radio", { name: /^Euvolaemic/ }));
    await user.type(screen.getByRole("spinbutton", { name: /Urine osmolality/ }), "120");
    await user.type(screen.getByRole("spinbutton", { name: /Urine sodium/ }), "40.1");

    expect(screen.getByRole("heading", { name: "SIADH-compatible pattern" })).toBeInTheDocument();
    expect(
      screen.getByRole("note", { name: /SIADH management is not available/ }),
    ).toBeInTheDocument();
  });

  it("fails closed at urine osmolality 100 and clears urine values after an upstream change", async () => {
    const user = userEvent.setup();
    render(<HyponatraemiaOsmolalityClassificationReview />);

    await user.click(screen.getByRole("radio", { name: /Yes - results available/i }));
    await user.type(screen.getByRole("spinbutton", { name: /Serum osmolality/ }), "270");
    await user.click(screen.getByRole("radio", { name: /^Euvolaemic/ }));
    const urineOsmolalityInput = screen.getByRole("spinbutton", { name: /Urine osmolality/ });
    await user.type(urineOsmolalityInput, "100");

    expect(
      screen.getByRole("note", { name: /Classification requires clinical review/ }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("radio", { name: /^Hypovolaemic/ }));
    expect(screen.queryByRole("spinbutton", { name: /Urine osmolality/ })).not.toBeInTheDocument();
    expect(screen.getByRole("spinbutton", { name: /Urine sodium/ })).toHaveValue(null);
  });
});
