import type { Metadata } from "next";

import SiteHeader from "@/components/SiteHeader";
import ThemeScript from "@/app/theme-script";

import "./globals.css";

export const metadata: Metadata = {
  title: "soroban-lint",
  description:
    "Browser static analysis for Soroban smart contracts. Runs the real WebAssembly build of soroban-lint entirely client-side.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className="min-h-screen antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-surface focus:px-3 focus:py-2 focus:text-ink"
        >
          Skip to content
        </a>
        <SiteHeader />
        <main id="main">{children}</main>
      </body>
    </html>
  );
}