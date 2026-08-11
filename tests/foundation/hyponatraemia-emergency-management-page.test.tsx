import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import HyponatraemiaEmergencyManagementPage, {
  metadata,
} from "@/app/review/hyponatraemia/emergency-management/page";

describe("hyponatraemia emergency-management page", () => {
  it("shows the version and unapproved emergency boundary without document references", () => {
    render(<HyponatraemiaEmergencyManagementPage />);

    expect(metadata.title).toBe("Hyponatraemia emergency-management review");
    expect(
      screen.getByRole("heading", { name: "Hyponatraemia emergency management" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("alert", { name: /Unapproved treatment preview/ })).toBeInTheDocument();
    expect(screen.getByText("Pathway v0.3.0")).toBeInTheDocument();
    expect(screen.queryByText("YSTHFT-HYPONATRAEMIA-EMERGENCY-V1")).not.toBeInTheDocument();
    expect(screen.getByText("Unstated four-hour interval")).toBeInTheDocument();
    expect(screen.getByText("Adult pathway boundary")).toBeInTheDocument();
  });
});
