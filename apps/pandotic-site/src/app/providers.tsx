"use client";

import type { ReactNode } from "react";
import { ThemeProvider } from "@pandotic/universal-cms/components/theme";
import { CmsProvider } from "@pandotic/universal-cms/components/admin";
import { cmsConfig } from "@/cms.config";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <CmsProvider config={cmsConfig}>{children}</CmsProvider>
    </ThemeProvider>
  );
}
