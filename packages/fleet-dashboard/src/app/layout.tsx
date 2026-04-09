import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { UserNav } from "./user-nav";

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
        <header className="border-b border-zinc-800 bg-zinc-900/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-14 items-center justify-between">
              <Link href="/" className="flex items-center gap-3">
                <span className="text-lg font-semibold tracking-tight text-white">
                  Pandotic Hub
                </span>
              </Link>
              <nav className="flex items-center gap-6 text-sm">
                <Link
                  href="/properties"
                  className="text-zinc-400 transition-colors hover:text-white"
                >
                  Properties
                </Link>
                <Link
                  href="/fleet"
                  className="text-zinc-400 transition-colors hover:text-white"
                >
                  Fleet
                </Link>
                <Link
                  href="/groups"
                  className="text-zinc-400 transition-colors hover:text-white"
                >
                  Groups
                </Link>
                <Link
                  href="/modules"
                  className="text-zinc-400 transition-colors hover:text-white"
                >
                  Modules
                </Link>
                <Link
                  href="/api-usage"
                  className="text-zinc-400 transition-colors hover:text-white"
                >
                  API Usage
                </Link>
                <Link
                  href="/api-keys"
                  className="text-zinc-400 transition-colors hover:text-white"
                >
                  API Keys
                </Link>
                <Link
                  href="/audit"
                  className="text-zinc-400 transition-colors hover:text-white"
                >
                  Audit
                </Link>
                <Link
                  href="/users"
                  className="text-zinc-400 transition-colors hover:text-white"
                >
                  Users
                </Link>
                <UserNav />
              </nav>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {children}
        </main>
      </body>
    </html>
  );
}
