import type { Metadata } from "next";
import "./globals.css";
import { NavShell } from "./nav/nav-shell";

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
        <NavShell>{children}</NavShell>
      </body>
    </html>
  );
}
