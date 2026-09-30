import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

vi.mock("next/font/local", () => ({
  default: () => ({
    className: "mock-local-font",
    style: { fontFamily: "Inter" },
    variable: "mock-local-font-variable",
  }),
}));
