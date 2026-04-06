import { Layer, LAYER_META } from "@/lib/types/category";
import { LAYER_COLORS } from "@/lib/constants/colors";

interface LayerBadgeProps {
  layer: Layer;
  size?: "sm" | "md";
}

export function LayerBadge({ layer, size = "sm" }: LayerBadgeProps) {
  const meta = LAYER_META[layer];
  const colors = LAYER_COLORS[layer];

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${colors.badgeBg} ${colors.badgeText} ${
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm"
      }`}
    >
      {meta.shortLabel}
    </span>
  );
}
