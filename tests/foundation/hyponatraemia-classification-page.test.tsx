import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import HyponatraemiaClassificationPage, {
  metadata,
} from "@/app/review/hyponatraemia/classification/page";

describe("hyponatraemia classification review page", () => {
  it("shows the review gate and pathway version without document or page references", () => {
    render(<HyponatraemiaClassificationPage />);

    expect(metadata.title).toBe("Hyponatraemia classification review");
    expect(
      screen.getByRole("heading", { name: "Urine and osmolality classification" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Pathway v0.4.0")).toBeInTheDocument();
    expect(
      screen.getByRole("note", { name: /Unapproved classification preview/ }),
    ).toBeInTheDocument();
    expect(screen.getByText("Exact boundaries stop safely")).toBeInTheDocument();
    expect(
      screen.queryByText(/Page 1|Registry ID|UNVERIFIED-HYPONATRAEMIA/i),
    ).not.toBeInTheDocument();
  });
});
