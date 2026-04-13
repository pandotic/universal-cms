import { AdminLayout } from "@pandotic/admin-ui";
import Link from "next/link";
import { Home, Users, Lock, Flag, Activity } from "lucide-react";
import { getEnabledFeatures } from "@/config/admin-config";

export default function AdminLayoutComponent({
  children,
}: {
  children: React.ReactNode;
}) {
  const enabledFeatures = getEnabledFeatures();

  // Build navigation items based on enabled features
  const navItems = [
    { label: "Dashboard", href: "/admin", icon: Home, always: true },
    enabledFeatures.includes("users") && {
      label: "Users",
      href: "/admin/users",
      icon: Users,
    },
    enabledFeatures.includes("organizations") && {
      label: "Organizations",
      href: "/admin/organizations",
      icon: Lock,
    },
    enabledFeatures.includes("featureFlags") && {
      label: "Feature Flags",
      href: "/admin/feature-flags",
      icon: Flag,
    },
    enabledFeatures.includes("auditLog") && {
      label: "Audit Log",
      href: "/admin/audit-log",
      icon: Activity,
    },
  ].filter(Boolean);

  return (
    <AdminLayout
      title="Admin Dashboard"
      description="Manage your application settings and users"
      sidebar={
        <nav className="space-y-2 px-3 py-6">
          {navItems.map((item: any) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white"
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      }
    >
      {children}
    </AdminLayout>
  );
}
