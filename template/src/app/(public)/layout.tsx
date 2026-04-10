import Link from "next/link";
import { cmsConfig } from "@/cms.config";
import { TrackingInjector } from "@pandotic/universal-cms/components/tracking";
import { createClient } from "@/lib/supabase/server";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { siteName, primaryEntity } = cmsConfig;
  const supabase = await createClient();

  return (
    <div className="flex min-h-screen flex-col">
      {/* Marketing-only trackers (GA4, GTM, LinkedIn, Meta Pixel, etc.) */}
      <TrackingInjector client={supabase} scope="marketing" />

      {/* Header — Customize for your site */}
      <header className="border-b border-border bg-surface">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link href="/" className="text-lg font-bold text-foreground">
            {siteName}
          </Link>
          <ul className="flex items-center gap-6 text-sm">
            <li>
              <Link
                href="/blog"
                className="text-foreground-secondary transition-colors hover:text-foreground"
              >
                Blog
              </Link>
            </li>
            <li>
              <Link
                href="/directory"
                className="text-foreground-secondary transition-colors hover:text-foreground"
              >
                {primaryEntity.plural}
              </Link>
            </li>
          </ul>
        </nav>
      </header>

      {/* Main content */}
      <main className="flex-1">{children}</main>

      {/* Footer — Customize for your site */}
      <footer className="border-t border-border bg-surface-secondary py-8">
        <div className="mx-auto max-w-6xl px-4 text-center text-sm text-foreground-secondary">
          <p>&copy; {new Date().getFullYear()} {siteName}. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
