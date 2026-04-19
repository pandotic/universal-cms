import type { Metadata } from "next";
import "./globals.css";
import { NavShell } from "./nav/nav-shell";
import { PageHelpPanel } from "@/components/page-help/PageHelpPanel";
import {
  ErrorBoundary,
  ErrorCaptureProvider,
} from "@pandotic/universal-cms/error-logging";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: {
    default: "Pandotic Hub",
    template: "%s | Pandotic Hub",
  },
  description: "Operations hub for Pandotic — fleet management, API usage tracking, and cost analytics across all deployed sites and apps",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-zinc-950 text-zinc-100 antialiased font-sans">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded focus:bg-zinc-900 focus:px-3 focus:py-2 focus:text-sm focus:text-white focus:ring-2 focus:ring-violet-500"
        >
          Skip to main content
        </a>
        <ErrorCaptureProvider endpoint="/api/errors">
          <ErrorBoundary name="RootLayout" endpoint="/api/errors">
            <NavShell>{children}</NavShell>
          </ErrorBoundary>
          <PageHelpPanel />
        </ErrorCaptureProvider>
      </body>
    </html>
  );
}
