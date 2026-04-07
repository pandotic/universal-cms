import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "Fleet Dashboard",
    template: "%s | Fleet Dashboard",
  },
  description: "Monitor all sites deployed with Universal CMS",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen bg-zinc-950 text-zinc-100 antialiased`}>
        <header className="border-b border-zinc-800 bg-zinc-900/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-14 items-center justify-between">
              <Link href="/" className="flex items-center gap-3">
                <span className="text-lg font-semibold tracking-tight text-white">
                  Fleet Dashboard
                </span>
              </Link>
              <nav className="flex items-center gap-6 text-sm">
                <Link
                  href="/"
                  className="text-zinc-400 transition-colors hover:text-white"
                >
                  Overview
                </Link>
                <Link
                  href="/modules"
                  className="text-zinc-400 transition-colors hover:text-white"
                >
                  Module Matrix
                </Link>
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
