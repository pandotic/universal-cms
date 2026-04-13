"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ToastProvider } from "@pandotic/universal-cms/components/ui"

const tabs = [
  { label: "Overview", href: "/apis" },
  { label: "Keys & Secrets", href: "/apis/keys" },
  { label: "Usage", href: "/apis/usage" },
  { label: "Services", href: "/apis/services" },
  { label: "Audit", href: "/apis/audit" },
]

export default function ApisLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  function isActive(href: string) {
    if (href === "/apis") return pathname === "/apis"
    return pathname.startsWith(href)
  }

  return (
    <ToastProvider>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            APIs & AI
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            API keys, usage tracking, cost analytics, and audit across the fleet
          </p>
        </div>

        <nav className="flex gap-1 border-b border-zinc-800 overflow-x-auto">
          {tabs.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              className={`whitespace-nowrap px-4 py-2.5 text-sm font-medium transition-colors border-b-2 ${
                isActive(tab.href)
                  ? "border-amber-500 text-amber-400"
                  : "border-transparent text-zinc-400 hover:text-white hover:border-zinc-600"
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </nav>

        <div>{children}</div>
      </div>
    </ToastProvider>
  )
}
