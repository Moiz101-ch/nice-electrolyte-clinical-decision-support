import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import HyponatraemiaOperationalResultPage, {
  metadata,
} from "@/app/review/hyponatraemia/result/page";
import { HYPONATRAEMIA_OPERATIONAL_RESULT_VERSION } from "@/src/clinical/pathways/hyponatraemia";

describe("hyponatraemia operational result page", () => {
  it("shows the fixed review example and explicit approval gate", () => {
    const { container } = render(<HyponatraemiaOperationalResultPage />);

    expect(metadata.title).toBe("Hyponatraemia operational result review");
    expect(
      screen.getByRole("heading", { level: 1, name: "Hyponatraemia operational result" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(`Pathway v${HYPONATRAEMIA_OPERATIONAL_RESULT_VERSION}`),
    ).toBeInTheDocument();
    expect(screen.getByRole("alert", { name: /Unapproved result preview/ })).toBeInTheDocument();
    expect(screen.getByText(/fixed test data and is not a patient record/)).toBeInTheDocument();
    expect(container.textContent).not.toMatch(/Page 1|Registry ID|UNVERIFIED-HYPONATRAEMIA/i);
  });
});
