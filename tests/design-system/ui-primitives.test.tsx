import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/states";
import { TextField } from "@/components/ui/text-field";

describe("design system primitives", () => {
  it("supports an actionable button", async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();

    render(
      <Button onClick={onClick} type="button">
        Continue
      </Button>,
    );
    await user.click(screen.getByRole("button", { name: "Continue" }));

    expect(onClick).toHaveBeenCalledOnce();
  });

  it("associates field guidance and errors with the input", () => {
    render(
      <TextField
        description="Use the locally reported unit."
        error="A value is required."
        id="electrolyte-value"
        label="Electrolyte value"
        required
      />,
    );

    const input = screen.getByRole("textbox", { name: /Electrolyte value/i });
    expect(input).toBeInvalid();
    expect(input).toHaveAccessibleDescription(
      "Use the locally reported unit. A value is required.",
    );
  });

  it("renders semantic alerts and reusable interface states", () => {
    render(
      <>
        <Alert title="Check the entered value" variant="warning">
          Confirm the unit before continuing.
        </Alert>
        <EmptyState description="No assessment is open." title="Empty workspace" />
        <ErrorState description="Please try again." title="Unable to load" />
        <LoadingState label="Loading assessment" />
      </>,
    );

    expect(screen.getByText("Check the entered value")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Empty workspace" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Unable to load" })).toBeInTheDocument();
    expect(screen.getByRole("status", { name: "Loading assessment" })).toBeInTheDocument();
  });
});
