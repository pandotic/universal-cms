import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import "./globals.css";
import { UserNav } from "./user-nav";
import { NavDropdown } from "./nav-dropdown";

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
              <Link href="/" className="flex items-center gap-2">
                <Image
                  src="/images/pandologo.avif"
                  alt="Pandotic Hub"
                  width={28}
                  height={28}
                  className="rounded-full"
                />
                <span className="text-lg font-semibold tracking-tight text-white">
                  Pandotic Hub
                </span>
              </Link>
              <nav className="flex items-center gap-1 text-sm">
                <NavDropdown
                  label="Operations"
                  items={[
                    { href: "/fleet", label: "Fleet Status" },
                    { href: "/properties", label: "Properties" },
                    { href: "/modules", label: "Modules" },
                    { href: "/apis", label: "APIs & AI" },
                    { href: "/skills", label: "Skills" },
                  ]}
                />
                <NavDropdown
                  label="CMS"
                  items={[
                    { href: "/cms/projects", label: "Projects" },
                    { href: "/cms/content", label: "Content Pages" },
                  ]}
                />
                <NavDropdown
                  label="Admin"
                  items={[
                    { href: "/groups", label: "Groups" },
                    { href: "/users", label: "Users" },
                  ]}
                />
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
