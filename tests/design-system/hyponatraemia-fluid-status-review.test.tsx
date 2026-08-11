import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { HyponatraemiaFluidStatusReview } from "@/components/pathways/hyponatraemia/fluid-status-review";

describe("hyponatraemia fluid-status review", () => {
  it("starts without a hidden fluid-status default", () => {
    render(<HyponatraemiaFluidStatusReview />);

    expect(screen.getByRole("heading", { name: "Moderate hyponatraemia" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Select fluid status" })).toBeInTheDocument();
    expect(screen.queryByText("Signs of cerebral oedema present?")).not.toBeInTheDocument();
    expect(screen.getAllByRole("radio")).toHaveLength(4);
    expect(screen.getAllByRole("radio").every((radio) => !radio.hasAttribute("checked"))).toBe(
      true,
    );
  });

  it("shows the exact adaptive sign check for hypovolaemia and euvolaemia", async () => {
    const user = userEvent.setup();
    render(<HyponatraemiaFluidStatusReview />);

    await user.click(screen.getByRole("radio", { name: /Hypovolaemic/ }));
    expect(screen.getByText("Signs of cerebral oedema present?")).toBeInTheDocument();
    expect(screen.getAllByRole("checkbox")).toHaveLength(7);
    expect(screen.getByRole("heading", { name: "Confirm listed signs" })).toBeInTheDocument();

    await user.click(screen.getByRole("checkbox", { name: "Nausea" }));
    expect(
      screen.getByRole("alert", { name: /Source emergency branch reached/ }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("radio", { name: /Euvolaemic/ }));
    expect(screen.getByRole("checkbox", { name: "Nausea" })).not.toBeChecked();
    expect(screen.getByRole("heading", { name: "Confirm listed signs" })).toBeInTheDocument();
  });

  it("keeps the none-confirmed answer mutually exclusive", async () => {
    const user = userEvent.setup();
    render(<HyponatraemiaFluidStatusReview />);

    await user.click(screen.getByRole("radio", { name: /Hypovolaemic/ }));
    const nausea = screen.getByRole("checkbox", { name: "Nausea" });
    const none = screen.getByRole("checkbox", {
      name: "None of the listed signs confirmed",
    });

    await user.click(nausea);
    await user.click(none);
    expect(nausea).not.toBeChecked();
    expect(none).toBeChecked();
    expect(
      screen.getByRole("heading", {
        name: "Hypovolaemic branch confirmed without a listed sign",
      }),
    ).toBeInTheDocument();

    await user.click(nausea);
    expect(nausea).toBeChecked();
    expect(none).not.toBeChecked();
  });

  it("skips the sign check for hypervolaemia and stops safely for uncertainty", async () => {
    const user = userEvent.setup();
    render(<HyponatraemiaFluidStatusReview />);

    await user.click(screen.getByRole("radio", { name: /Hypervolaemic/ }));
    expect(screen.queryByText("Signs of cerebral oedema present?")).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Hypervolaemic source endpoint reached" }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("radio", { name: /Unable to establish safely/ }));
    expect(
      screen.getByRole("note", { name: /Fluid status requires clinical review/ }),
    ).toBeInTheDocument();
    expect(screen.queryAllByRole("checkbox")).toHaveLength(0);
  });
});
