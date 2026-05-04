"use client";

import React from "react";
import { getAdminModule } from "../../../admin/modules.js";
import { cn } from "../../../utils/index.js";

export interface ModulePreviewPanelProps {
  /** Module id from the cms-core admin registry (e.g. "directory"). */
  moduleId: string;
  /**
   * Optional URL of the Pandotic Hub property's modules page so operators
   * can flip the module on. e.g.
   * `https://pandhub.netlify.app/properties/pandotic-site/modules`.
   * When omitted, the CTA is rendered as plain text.
   */
  hubModulesUrl?: string;
  /** Optional site name for the body copy. */
  siteName?: string;
  className?: string;
}

/**
 * Fallback panel for modules that ship in the universal CMS but are not
 * activated on the current site. Renders the registry's sample rows so
 * operators can see what the module looks like, plus a CTA that points
 * at the Hub for enabling it.
 *
 * Used by `<AdminShell>` when `CmsConfig.inactiveModulesMode === 'preview'`
 * and a sidebar link is followed for a disabled module.
 */
export function ModulePreviewPanel({
  moduleId,
  hubModulesUrl,
  siteName,
  className,
}: ModulePreviewPanelProps) {
  const mod = getAdminModule(moduleId);

  if (!mod) {
    return (
      <div
        className={cn(
          "rounded-lg border border-border bg-surface p-6 text-sm text-foreground-secondary",
          className,
        )}
      >
        Unknown module: <span className="font-mono">{moduleId}</span>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-wider text-foreground-tertiary">
          Available in universal CMS
        </div>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">
          {mod.label}
        </h1>
        <p className="mt-1 text-sm text-foreground-secondary">
          {mod.description}
        </p>
      </div>

      <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-xs text-amber-200/80 dark:text-amber-300/80">
        <p>
          This module ships with the universal CMS but isn&rsquo;t enabled
          {siteName ? ` on ${siteName}` : " on this site"}. The rows below are
          sample data; real entries appear once the module is activated.
        </p>
        <p className="mt-2">
          {hubModulesUrl ? (
            <a
              href={hubModulesUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="font-medium underline decoration-amber-500/40 underline-offset-2 hover:text-amber-100"
            >
              Enable in Pandotic Hub →
            </a>
          ) : (
            <span>
              Enable it in Pandotic Hub → Properties → Modules.
            </span>
          )}
        </p>
      </div>

      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-secondary">
              <th className="px-4 py-3 text-left font-medium text-foreground-secondary">
                Item
              </th>
              <th className="px-4 py-3 text-left font-medium text-foreground-secondary">
                Details
              </th>
              <th className="px-4 py-3 text-right font-medium text-foreground-secondary">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {mod.previewRows.map((row, i) => (
              <tr
                key={i}
                className="transition-colors hover:bg-surface-secondary/50"
              >
                <td className="px-4 py-3">
                  <div className="font-medium text-foreground">{row.title}</div>
                  {row.subtitle && (
                    <div className="mt-0.5 text-xs text-foreground-tertiary">
                      {row.subtitle}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-foreground-secondary">
                  {row.meta ?? "—"}
                </td>
                <td className="px-4 py-3 text-right">
                  {row.status ? (
                    <span className="inline-flex rounded-full bg-surface-tertiary px-2 py-0.5 text-[11px] text-foreground-secondary">
                      {row.status}
                    </span>
                  ) : (
                    <span className="text-foreground-tertiary">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
