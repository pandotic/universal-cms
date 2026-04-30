import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireHubRole, apiError } from "@pandotic/universal-cms/middleware";
import { modulePresets, type CmsModuleName } from "@pandotic/universal-cms/config";

function recommendPreset(detectedModules: string[]): string | null {
  if (detectedModules.length === 0) return null;

  let bestMatch = { key: null as string | null, score: 0 };

  for (const [key, preset] of Object.entries(modulePresets)) {
    // Count how many detected modules are in this preset
    const matchCount = detectedModules.filter((m) =>
      preset.modules.includes(m as CmsModuleName)
    ).length;

    // Score: intersection size / union size (Jaccard similarity)
    const unionSize = new Set([
      ...detectedModules,
      ...preset.modules,
    ]).size;
    const score = matchCount / unionSize;

    if (score > bestMatch.score) {
      bestMatch = { key, score };
    }
  }

  return bestMatch.score > 0 ? bestMatch.key : null;
}

export async function GET(request: NextRequest) {
  try {
    const authClient = await createClient();
    const authError = await requireHubRole(authClient, request, [
      "super_admin", "group_admin",
    ]);
    if (authError) return authError;

    const { searchParams } = new URL(request.url);
    // Support both OAuth cookie and query param (for backward compatibility)
    const token = request.cookies.get("github_token")?.value || searchParams.get("token");
    const repo = searchParams.get("repo"); // owner/name format

    if (!token || !repo) {
      return NextResponse.json(
        { error: "GitHub token and repo required. Use /api/github/oauth/authorize to login." },
        { status: 401 }
      );
    }

    const headers = {
      Authorization: `token ${token}`,
      Accept: "application/vnd.github.v3+json",
    };

    // Read package.json from the repo
    let packageJson: Record<string, any> | null = null;
    try {
      const res = await fetch(
        `https://api.github.com/repos/${repo}/contents/package.json`,
        { headers }
      );
      if (res.ok) {
        const data = await res.json();
        const content = Buffer.from(data.content, "base64").toString("utf-8");
        packageJson = JSON.parse(content);
      }
    } catch {
      // No package.json — not a Node project
    }

    const deps = {
      ...(packageJson?.dependencies ?? {}),
      ...(packageJson?.devDependencies ?? {}),
    };

    const cmsVersion = deps["@pandotic/universal-cms"] ?? null;
    const skillLibraryVersion = deps["@pandotic/skill-library"] ?? null;
    const hasNextjs = !!deps["next"];
    const hasSupabase = !!deps["@supabase/supabase-js"];

    // Try to detect platform type
    let detectedPlatform = "other";
    if (hasNextjs && hasSupabase) detectedPlatform = "nextjs_supabase";
    else if (hasNextjs) detectedPlatform = "static";

    // Try to read cms.config.ts for module info
    let enabledModules: string[] = [];
    try {
      // Check common locations for CMS config
      for (const path of ["src/cms.config.ts", "cms.config.ts"]) {
        const res = await fetch(
          `https://api.github.com/repos/${repo}/contents/${path}`,
          { headers }
        );
        if (res.ok) {
          const data = await res.json();
          const content = Buffer.from(data.content, "base64").toString("utf-8");
          // Extract module names that are set to true
          const moduleMatches = content.matchAll(/(\w+):\s*true/g);
          enabledModules = [...moduleMatches].map((m) => m[1]);
          break;
        }
      }
    } catch {
      // No CMS config found
    }

    // Recommend a preset based on detected modules
    const recommendedPreset = recommendPreset(enabledModules);

    return NextResponse.json({
      data: {
        hasCms: !!cmsVersion,
        cmsVersion: cmsVersion?.replace(/^[\^~]/, "") ?? null,
        skillLibraryVersion: skillLibraryVersion?.replace(/^[\^~]/, "") ?? null,
        detectedPlatform,
        hasNextjs,
        hasSupabase,
        enabledModules,
        recommendedPreset,
        projectName: packageJson?.name ?? null,
      },
    });
  } catch (e) {
    return apiError(e);
  }
}
