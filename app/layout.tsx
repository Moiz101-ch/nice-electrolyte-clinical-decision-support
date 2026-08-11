import type { Metadata, Viewport } from "next";

import "@fontsource-variable/inter";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Electrolyte Pathways",
    template: "%s | Electrolyte Pathways",
  },
  description:
    "Source-governed clinical pathway workspace for adult electrolyte abnormalities using deterministic evaluation and explicit clinical review.",
  other: {
    "darkreader-lock": "true",
  },
};

export const viewport: Viewport = {
  themeColor: "#f5f7fa",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
