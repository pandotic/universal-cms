"use client";

import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme } from "./ThemeContext";
import { cn } from "../../utils";

const options = [
  { value: "light" as const, icon: Sun, label: "Light" },
  { value: "dark" as const, icon: Moon, label: "Dark" },
  { value: "system" as const, icon: Monitor, label: "System" },
];

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-lg border border-border bg-surface-secondary p-0.5",
        className
      )}
    >
      {options.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          onClick={() => setTheme(value)}
          className={cn(
            "inline-flex items-center justify-center rounded-md p-1.5 text-foreground-tertiary transition-colors",
            theme === value &&
              "bg-surface text-foreground shadow-sm"
          )}
          title={label}
          aria-label={`Switch to ${label} theme`}
        >
          <Icon className="h-3.5 w-3.5" />
        </button>
      ))}
    </div>
  );
}
