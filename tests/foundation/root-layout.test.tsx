import { describe, expect, it } from "vitest";

import RootLayout, { metadata } from "@/app/layout";

describe("root layout hydration hardening", () => {
  it("preserves clinical colors and tolerates browser-extension root attributes", () => {
    expect(metadata.other).toEqual({ "darkreader-lock": "true" });

    const layout = RootLayout({ children: <main>Content</main> });
    const body = layout.props.children;

    expect(layout.props.suppressHydrationWarning).toBe(true);
    expect(body.props.suppressHydrationWarning).toBe(true);
  });
});
