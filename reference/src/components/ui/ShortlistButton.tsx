"use client";

import { useAuth } from "@/lib/context/AuthContext";
import { useShortlist } from "@/lib/context/ShortlistContext";

interface ShortlistButtonProps {
  entityId: string;
  size?: "sm" | "md";
  className?: string;
}

export function ShortlistButton({ entityId, size = "sm", className = "" }: ShortlistButtonProps) {
  const { user, openLoginModal } = useAuth();
  const { isShortlisted, toggle } = useShortlist();
  const active = isShortlisted(entityId);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      openLoginModal();
      return;
    }
    toggle(entityId);
  };

  const iconSize = size === "sm" ? "h-3.5 w-3.5" : "h-4.5 w-4.5";
  const padding = size === "sm" ? "p-1" : "p-1.5";

  return (
    <button
      onClick={handleClick}
      className={`group/star rounded-full transition-all ${padding} ${
        active
          ? "text-amber-500 hover:text-amber-600"
          : "text-foreground-muted hover:text-amber-400"
      } ${className}`}
      title={active ? "Remove from shortlist" : "Add to shortlist"}
      aria-label={active ? "Remove from shortlist" : "Add to shortlist"}
    >
      <svg
        className={`${iconSize} transition-transform group-hover/star:scale-110`}
        viewBox="0 0 24 24"
        fill={active ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z"
        />
      </svg>
    </button>
  );
}
