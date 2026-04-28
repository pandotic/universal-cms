"use client";

import { createElement, type ReactElement, type ReactNode } from "react";
import { usePathname } from "next/navigation";

/**
 * Renders the public-site Navbar/Footer chrome around `children`, except
 * on `/admin` paths where the AdminShell provides its own chrome.
 *
 * Navbar + Footer are passed as React element props so they can be rendered
 * by the server before being conditionally placed by this client component.
 *
 * The `<main>` wrapper is built via `createElement` to dodge a TypeScript
 * intrinsic-element typing collision between two @types/react copies that
 * resolve in this monorepo (cms-core uses ^19.0.0, pandotic-site pins
 * 19.1.6 — both compatible at runtime, but TS sees two ReactNode types).
 */
export function PublicChrome({
  navbar,
  footer,
  children,
}: {
  navbar: ReactElement;
  footer: ReactElement;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  if (isAdmin) return <>{children}</>;

  return (
    <>
      {navbar}
      {createElement(
        "main",
        { id: "main-content", className: "pt-16" },
        children,
      )}
      {footer}
    </>
  );
}
