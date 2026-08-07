import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Home from "@/app/page";

describe("foundation home placeholder", () => {
  it("renders the project name and prototype safety notice", () => {
    render(<Home />);

    expect(screen.getByRole("heading", { name: "NICE Electrolyte CDS" })).toBeInTheDocument();
    expect(
      screen.getByText(/Do not enter real patient-identifiable information/i),
    ).toBeInTheDocument();
  });
});
