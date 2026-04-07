"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { CmsConfig } from "../../config";

const CmsContext = createContext<CmsConfig | null>(null);

export function CmsProvider({
  config,
  children,
}: {
  config: CmsConfig;
  children: ReactNode;
}) {
  return <CmsContext.Provider value={config}>{children}</CmsContext.Provider>;
}

export function useCmsConfig(): CmsConfig {
  const config = useContext(CmsContext);
  if (!config) {
    throw new Error("useCmsConfig must be used within a CmsProvider");
  }
  return config;
}
