"use client";

import * as React from "react";
import { cn } from "../../utils";

interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  className?: string;
  disabled?: boolean;
  id?: string;
}

function Switch({ checked, onCheckedChange, className, disabled, id }: SwitchProps) {
  return (
    <button
      role="switch"
      id={id}
      aria-checked={checked}
      disabled={disabled}
      className={cn(
        "inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        checked ? "bg-brand-primary" : "bg-active",
        className
      )}
      onClick={() => onCheckedChange(!checked)}
      type="button"
    >
      <span
        className={cn(
          "pointer-events-none block h-4 w-4 rounded-full bg-white shadow-lg ring-0 transition-transform",
          checked ? "translate-x-4" : "translate-x-0"
        )}
      />
    </button>
  );
}

export { Switch };
