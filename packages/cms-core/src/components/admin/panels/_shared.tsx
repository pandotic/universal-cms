"use client";

import type { ReactNode } from "react";
import { cn } from "../../../utils/index.js";

export const inputClass =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground focus:border-border-strong focus:outline-none";

export function PanelHeading({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-sm text-foreground-secondary">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function PanelError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3">
      <p className="text-sm text-red-400">{message}</p>
    </div>
  );
}

export function PanelSpinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-foreground" />
    </div>
  );
}

export function PanelEmpty({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-8 text-center">
      <p className="text-sm text-foreground-secondary">{children}</p>
    </div>
  );
}

export function StatusBadge({
  status,
  tone,
}: {
  status: string;
  tone?: "success" | "warning" | "danger" | "neutral";
}) {
  const palette =
    tone === "success"
      ? "bg-emerald-500/15 text-emerald-400"
      : tone === "warning"
        ? "bg-amber-500/15 text-amber-300"
        : tone === "danger"
          ? "bg-red-500/15 text-red-400"
          : "bg-surface-tertiary text-foreground-secondary";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium",
        palette,
      )}
    >
      {status}
    </span>
  );
}

export function PrimaryButton({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-surface transition-colors hover:bg-foreground-secondary disabled:opacity-50"
    >
      {children}
    </button>
  );
}

export function GhostButton({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className="rounded-lg border border-border px-4 py-2 text-sm text-foreground-secondary transition-colors hover:text-foreground"
    >
      {children}
    </button>
  );
}

export function Field({
  label,
  required,
  help,
  children,
}: {
  label: string;
  required?: boolean;
  help?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-foreground-secondary">
        {label}
        {required && <span className="ml-0.5 text-red-400">*</span>}
      </label>
      {children}
      {help && (
        <p className="mt-1 text-[11px] text-foreground-tertiary">{help}</p>
      )}
    </div>
  );
}
