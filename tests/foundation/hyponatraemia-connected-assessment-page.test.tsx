import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import HyponatraemiaConnectedAssessmentPage, {
  metadata,
} from "@/app/review/hyponatraemia/assessment/page";
import { HYPONATRAEMIA_CONNECTED_ASSESSMENT_VERSION } from "@/src/clinical/pathways/hyponatraemia";

describe("connected Hyponatraemia assessment page", () => {
  it("renders the connected review with explicit governance and privacy boundaries", () => {
    const { container } = render(<HyponatraemiaConnectedAssessmentPage />);

    expect(metadata.title).toBe("Connected Hyponatraemia assessment review");
    expect(
      screen.getByRole("heading", { level: 1, name: "Hyponatraemia assessment" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(`Pathway v${HYPONATRAEMIA_CONNECTED_ASSESSMENT_VERSION}`),
    ).toBeInTheDocument();
    expect(screen.getByRole("alert", { name: /Unapproved pathway review/ })).toBeInTheDocument();
    expect(screen.getByText(/cleared on refresh/)).toBeInTheDocument();
    expect(container.textContent).not.toMatch(/Page 1|Registry ID|UNVERIFIED-HYPONATRAEMIA/i);
  });
});
