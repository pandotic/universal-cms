"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  HelpCircle,
  X,
  Database,
  Link2,
  Code,
  Shield,
  BookOpen,
} from "lucide-react";
import { matchHelp, type PageHelp } from "@/lib/page-help/registry";

const HIDDEN_ROUTES = new Set(["/login"]);

export function PageHelpPanel() {
  const pathname = usePathname() ?? "/";
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  if (HIDDEN_ROUTES.has(pathname)) return null;

  const help = matchHelp(pathname);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed right-4 top-16 z-40 flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-900/90 px-3 py-1.5 text-xs font-medium text-zinc-200 shadow-lg backdrop-blur-sm transition hover:border-zinc-600 hover:bg-zinc-800"
        aria-label="Tell me about this page"
      >
        <HelpCircle className="h-4 w-4 text-emerald-400" aria-hidden />
        <span>Tell Me About This Page</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <aside
            role="dialog"
            aria-modal="true"
            aria-labelledby="page-help-title"
            className="absolute right-0 top-0 flex h-full w-[440px] max-w-[90vw] flex-col border-l border-zinc-800 bg-zinc-950 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4 border-b border-zinc-800 px-5 py-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-zinc-500">
                  <BookOpen className="h-3.5 w-3.5" aria-hidden />
                  About this page
                </div>
                <h2
                  id="page-help-title"
                  className="mt-1 truncate text-lg font-semibold text-zinc-100"
                >
                  {help?.title ?? pathname}
                </h2>
                <code className="mt-1 block truncate text-[11px] text-zinc-500">
                  {pathname}
                </code>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="shrink-0 rounded-md p-1 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-5 text-sm text-zinc-300">
              {help ? <HelpBody help={help} /> : <EmptyState />}
            </div>
          </aside>
        </div>
      )}
    </>
  );
}

function HelpBody({ help }: { help: PageHelp }) {
  const { purpose, howToUse, builtWith } = help;
  return (
    <div className="space-y-6">
      <section>
        <SectionHeading>What this page does</SectionHeading>
        <p className="mt-2 leading-relaxed text-zinc-300">{purpose}</p>
      </section>

      {howToUse.length > 0 && (
        <section>
          <SectionHeading>How to use it</SectionHeading>
          <ul className="mt-2 space-y-1.5 text-zinc-300">
            {howToUse.map((item, i) => (
              <li key={i} className="flex gap-2">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-emerald-400" aria-hidden />
                <span className="leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <SectionHeading>How it's built</SectionHeading>
        <div className="mt-3 space-y-3">
          {builtWith.tables && (
            <BuiltWithRow
              icon={<Database className="h-3.5 w-3.5" aria-hidden />}
              label="Tables"
              items={builtWith.tables}
            />
          )}
          {builtWith.apiRoutes && (
            <BuiltWithRow
              icon={<Link2 className="h-3.5 w-3.5" aria-hidden />}
              label="API routes"
              items={builtWith.apiRoutes}
            />
          )}
          {builtWith.dataFunctions && (
            <BuiltWithRow
              icon={<Code className="h-3.5 w-3.5" aria-hidden />}
              label="Data functions"
              items={builtWith.dataFunctions}
            />
          )}
          {builtWith.auth && (
            <BuiltWithRow
              icon={<Shield className="h-3.5 w-3.5" aria-hidden />}
              label="Auth"
              items={[builtWith.auth]}
            />
          )}
          {builtWith.relatedPages && (
            <BuiltWithRow
              icon={<Link2 className="h-3.5 w-3.5" aria-hidden />}
              label="Related pages"
              items={builtWith.relatedPages}
            />
          )}
          {builtWith.notes && (
            <p className="rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-xs leading-relaxed text-zinc-400">
              {builtWith.notes}
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-md border border-dashed border-zinc-800 bg-zinc-900/40 p-4 text-xs leading-relaxed text-zinc-400">
      No help content for this page yet. Add an entry in{" "}
      <code className="rounded bg-zinc-900 px-1 py-0.5 font-mono text-zinc-300">
        src/lib/page-help/registry.ts
      </code>
      .
    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
      {children}
    </h3>
  );
}

function BuiltWithRow({
  icon,
  label,
  items,
}: {
  icon: React.ReactNode;
  label: string;
  items: string[];
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-zinc-500">
        {icon}
        {label}
      </div>
      <ul className="mt-1.5 space-y-1">
        {items.map((item, i) => (
          <li
            key={i}
            className="rounded bg-zinc-900 px-2 py-1 font-mono text-[11px] text-zinc-300"
          >
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
