"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { label: "Overview", href: "/admin/careers-training" },
  { label: "Providers", href: "/admin/careers-training/providers" },
  { label: "Programs", href: "/admin/careers-training/programs" },
  { label: "Roles", href: "/admin/careers-training/roles" },
  { label: "Resources", href: "/admin/careers-training/resources" },
  { label: "Tags", href: "/admin/careers-training/tags" },
  { label: "Job Sources", href: "/admin/careers-training/job-sources" },
];

export default function AdminCareersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Career Hub Catalog</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage providers, programs, roles, resources, tags, and job sources.
        </p>
      </div>

      {/* Tabs */}
      <nav className="mb-8 flex gap-1 overflow-x-auto border-b border-gray-200">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/admin/careers-training"
              ? pathname === item.href
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "border-brand-primary text-brand-primary"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      {children}
    </div>
  );
}
