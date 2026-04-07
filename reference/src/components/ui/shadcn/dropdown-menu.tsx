"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface DropdownMenuProps {
  children: React.ReactNode;
}

interface DropdownMenuContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const DropdownMenuContext = React.createContext<DropdownMenuContextValue | null>(
  null
);

function DropdownMenu({ children }: DropdownMenuProps) {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-dropdown-menu]")) {
        setOpen(false);
      }
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [open]);

  return (
    <DropdownMenuContext.Provider value={{ open, setOpen }}>
      <div className="relative inline-block" data-dropdown-menu>
        {children}
      </div>
    </DropdownMenuContext.Provider>
  );
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function DropdownMenuTrigger({
  children,
  className,
  asChild,
}: {
  children: React.ReactNode;
  className?: string;
  asChild?: boolean;
}) {
  const ctx = React.useContext(DropdownMenuContext)!;

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      onClick: (e: React.MouseEvent) => {
        (children as React.ReactElement<any>).props.onClick?.(e);
        ctx.setOpen(!ctx.open);
      },
    });
  }

  return (
    <button
      className={className}
      onClick={() => ctx.setOpen(!ctx.open)}
      type="button"
    >
      {children}
    </button>
  );
}

function DropdownMenuContent({
  children,
  className,
  align = "end",
}: {
  children: React.ReactNode;
  className?: string;
  align?: "start" | "end";
}) {
  const ctx = React.useContext(DropdownMenuContext)!;
  if (!ctx.open) return null;

  return (
    <div
      className={cn(
        "absolute z-50 mt-1 min-w-[8rem] overflow-hidden rounded-md border border-border bg-surface p-1 shadow-md",
        align === "end" ? "right-0" : "left-0",
        className
      )}
    >
      {children}
    </div>
  );
}

function DropdownMenuItem({
  children,
  className,
  onClick,
  destructive,
  asChild,
  disabled,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  destructive?: boolean;
  asChild?: boolean;
  disabled?: boolean;
}) {
  const ctx = React.useContext(DropdownMenuContext)!;
  const itemClasses = cn(
    "flex w-full items-center rounded-sm px-2 py-1.5 text-sm transition-colors",
    destructive
      ? "text-red-600 hover:bg-red-50"
      : "text-foreground-secondary hover:bg-hover",
    disabled && "pointer-events-none opacity-50",
    className
  );

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      className: cn(
        itemClasses,
        (children as React.ReactElement<any>).props.className
      ),
      onClick: (e: React.MouseEvent) => {
        (children as React.ReactElement<any>).props.onClick?.(e);
        onClick?.();
        ctx.setOpen(false);
      },
    });
  }

  return (
    <button
      className={itemClasses}
      onClick={() => {
        if (disabled) return;
        onClick?.();
        ctx.setOpen(false);
      }}
      disabled={disabled}
      type="button"
    >
      {children}
    </button>
  );
}
/* eslint-enable @typescript-eslint/no-explicit-any */

function DropdownMenuSeparator({ className }: { className?: string }) {
  return <div className={cn("-mx-1 my-1 h-px bg-surface-tertiary", className)} />;
}

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
};
