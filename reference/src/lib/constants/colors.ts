import { Layer } from "@/lib/types/category";

export const LAYER_COLORS: Record<
  Layer,
  {
    bg50: string;
    bg100: string;
    bg200: string;
    text500: string;
    text700: string;
    text900: string;
    border200: string;
    badgeBg: string;
    badgeText: string;
    mapCell: string;
  }
> = {
  [Layer.RULES_STANDARDS]: {
    bg50: "bg-layer-rules-50",
    bg100: "bg-layer-rules-100",
    bg200: "bg-layer-rules-200",
    text500: "text-layer-rules-500",
    text700: "text-layer-rules-700",
    text900: "text-layer-rules-900",
    border200: "border-layer-rules-200",
    badgeBg: "bg-layer-rules-100",
    badgeText: "text-layer-rules-700",
    mapCell: "bg-layer-rules-50 border-layer-rules-200",
  },
  [Layer.DATA_MEASUREMENT]: {
    bg50: "bg-layer-data-50",
    bg100: "bg-layer-data-100",
    bg200: "bg-layer-data-200",
    text500: "text-layer-data-500",
    text700: "text-layer-data-700",
    text900: "text-layer-data-900",
    border200: "border-layer-data-200",
    badgeBg: "bg-layer-data-100",
    badgeText: "text-layer-data-700",
    mapCell: "bg-layer-data-50 border-layer-data-200",
  },
  [Layer.IMPLEMENTATION_SERVICES]: {
    bg50: "bg-layer-impl-50",
    bg100: "bg-layer-impl-100",
    bg200: "bg-layer-impl-200",
    text500: "text-layer-impl-500",
    text700: "text-layer-impl-700",
    text900: "text-layer-impl-900",
    border200: "border-layer-impl-200",
    badgeBg: "bg-layer-impl-100",
    badgeText: "text-layer-impl-700",
    mapCell: "bg-layer-impl-50 border-layer-impl-200",
  },
};
