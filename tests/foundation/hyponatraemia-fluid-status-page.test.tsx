import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import HyponatraemiaFluidStatusPage, {
  metadata,
} from "@/app/review/hyponatraemia/fluid-status/page";

describe("hyponatraemia fluid-status review page", () => {
  it("shows the cumulative pathway version and no-management boundary", () => {
    render(<HyponatraemiaFluidStatusPage />);

    expect(metadata.title).toBe("Hyponatraemia fluid-status review");
    expect(
      screen.getByRole("heading", { name: "Fluid-status workflow review" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Branch classification only - no management output"),
    ).toBeInTheDocument();
    expect(screen.getByText("Pathway v0.2.0")).toBeInTheDocument();
    expect(screen.queryByText("YSTHFT-HYPONATRAEMIA-EMERGENCY-V1")).not.toBeInTheDocument();
    expect(screen.getByText("Uncertainty stops the workflow")).toBeInTheDocument();
  });
});
