import type { Metadata, Viewport } from "next";

import "@fontsource-variable/inter";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "NICE Electrolyte CDS",
    template: "%s | NICE Electrolyte CDS",
  },
  description:
    "Educational clinical decision-support prototype for adult electrolyte abnormalities using deterministic NICE-based rules.",
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
