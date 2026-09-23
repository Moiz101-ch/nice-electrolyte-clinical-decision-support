import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";

import "./globals.css";

const inter = localFont({
  display: "swap",
  fallback: ["Inter", "Arial", "sans-serif"],
  src: "./fonts/inter-latin-wght-normal.woff2",
  variable: "--font-inter",
  weight: "100 900",
});

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
    <html className={inter.variable} lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
