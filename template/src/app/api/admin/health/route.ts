import { NextResponse } from "next/server";
import { CMS_VERSION } from "@pandotic/universal-cms/version";
import type { CmsModuleName } from "@pandotic/universal-cms/config";
import { cmsConfig } from "@/cms.config";

const startedAt = Date.now();

export async function GET() {
  const enabledModules = Object.entries(cmsConfig.modules)
    .filter(([, enabled]) => enabled)
    .map(([name]) => name as CmsModuleName);

  const disabledModules = Object.entries(cmsConfig.modules)
    .filter(([, enabled]) => !enabled)
    .map(([name]) => name as CmsModuleName);

  return NextResponse.json({
    version: CMS_VERSION,
    siteName: cmsConfig.siteName,
    siteUrl: cmsConfig.siteUrl,
    enabledModules,
    disabledModules,
    moduleCount: { enabled: enabledModules.length, disabled: disabledModules.length },
    uptimeMs: Date.now() - startedAt,
  });
}
