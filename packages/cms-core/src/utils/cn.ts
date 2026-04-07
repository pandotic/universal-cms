import { type ClassValue, clsx } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "bg-color": [
        "bg-surface",
        "bg-surface-secondary",
        "bg-surface-tertiary",
        "bg-surface-invert",
        "bg-hover",
        "bg-active",
      ],
      "text-color": [
        "text-foreground",
        "text-foreground-secondary",
        "text-foreground-tertiary",
        "text-foreground-muted",
        "text-foreground-invert",
      ],
      "border-color": ["border-border", "border-border-strong"],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
