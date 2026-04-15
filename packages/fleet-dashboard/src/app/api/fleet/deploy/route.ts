import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { requireHubRole, apiError } from "@pandotic/universal-cms/middleware";
import { getPropertyById, updateProperty } from "@pandotic/universal-cms/data/hub";
import {
  upsertPackageDeployment,
  logPackageDeploymentEvent,
} from "@pandotic/universal-cms/data/hub-package-deployments";
import { CMS_VERSION } from "@pandotic/universal-cms/version";
import { modulePresets } from "@pandotic/universal-cms/config";

// ─── GitHub API Helpers ───────────────────────────────────────────────────

async function ghFetch(url: string, token: string, options: RequestInit = {}) {
  return fetch(url, {
    ...options,
    headers: {
      Authorization: `token ${token}`,
      "Content-Type": "application/json",
      Accept: "application/vnd.github.v3+json",
      ...((options.headers as Record<string, string>) ?? {}),
    },
  });
}

async function ghJson(res: Response) {
  const body = await res.json();
  if (!res.ok) throw new Error(body.message || `GitHub API ${res.status}`);
  return body;
}

// ─── CMS Config Generator ────────────────────────────────────────────────

function generateCmsConfig(siteName: string, modules: string[], preset: string): string {
  const moduleEntries = modules
    .map((m) => `    ${m}: true,`)
    .join("\n");

  return `import type { CmsConfig } from "@pandotic/universal-cms/config";

export const cmsConfig: CmsConfig = {
  siteName: "${siteName}",
  siteUrl: "",
  siteDescription: "",
  siteTagline: "",

  primaryEntity: {
    name: "entities",
    singular: "Entity",
    plural: "Entities",
    slugPrefix: "/directory",
  },

  modules: {
${moduleEntries}
  } as CmsConfig["modules"],

  roles: ["admin", "editor"],

  adminNav: [
    {
      group: "Content",
      items: [
        { label: "Pages", href: "/admin/content-pages", module: "contentPages" },
        { label: "Media", href: "/admin/media", module: "mediaLibrary" },
      ],
    },
  ],

  analytics: {
    availableProviders: ["ga4"],
  },

  storage: {
    mediaBucket: "media",
    maxFileSizeMb: 10,
    allowedMimeTypes: ["image/*", "application/pdf"],
  },
};
`;
}

function generateHealthEndpoint(): string {
  return `import { NextResponse } from "next/server";
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
`;
}

// ─── Deploy Endpoint ──────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const authClient = await createClient();
    const authError = await requireHubRole(authClient, request, [
      "super_admin", "group_admin",
    ]);
    if (authError) return authError;

    const supabase = await createAdminClient();
    const body = await request.json();
    const { propertyId, ghToken, preset, modules } = body as {
      propertyId: string;
      ghToken: string;
      preset: string;
      modules: string[];
    };

    if (!propertyId || !ghToken || !modules?.length) {
      return NextResponse.json(
        { error: "propertyId, ghToken, and modules are required" },
        { status: 400 }
      );
    }

    const property = await getPropertyById(supabase, propertyId);
    if (!property) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }
    if (!property.github_repo) {
      return NextResponse.json({ error: "Property has no GitHub repo" }, { status: 400 });
    }

    const repo = property.github_repo;

    // 1. Get default branch SHA
    const repoData = await ghJson(await ghFetch(`https://api.github.com/repos/${repo}`, ghToken));
    const defaultBranch = repoData.default_branch;

    const refData = await ghJson(
      await ghFetch(`https://api.github.com/repos/${repo}/git/ref/heads/${defaultBranch}`, ghToken)
    );
    const baseSha = refData.object.sha;

    // 2. Create feature branch
    const branchName = `cms/install-${Date.now()}`;
    await ghJson(
      await ghFetch(`https://api.github.com/repos/${repo}/git/refs`, ghToken, {
        method: "POST",
        body: JSON.stringify({ ref: `refs/heads/${branchName}`, sha: baseSha }),
      })
    );

    // 3. Add files
    const files = [
      {
        path: "src/cms.config.ts",
        content: generateCmsConfig(property.name, modules, preset),
      },
      {
        path: "src/app/api/admin/health/route.ts",
        content: generateHealthEndpoint(),
      },
    ];

    for (const file of files) {
      await ghJson(
        await ghFetch(`https://api.github.com/repos/${repo}/contents/${file.path}`, ghToken, {
          method: "PUT",
          body: JSON.stringify({
            message: `Add ${file.path} — CMS install via Pandotic Hub`,
            content: Buffer.from(file.content).toString("base64"),
            branch: branchName,
          }),
        })
      );
    }

    // 4. Create PR
    const prBody = `## CMS Installation via Pandotic Hub

This PR installs \`@pandotic/universal-cms\` with the following configuration:

**Preset:** ${preset}
**Modules (${modules.length}):** ${modules.join(", ")}

### Files Added
- \`src/cms.config.ts\` — CMS configuration with selected modules
- \`src/app/api/admin/health/route.ts\` — Health endpoint for fleet monitoring

### Next Steps
1. Run \`pnpm add @pandotic/universal-cms\` to install the package
2. Run the required Supabase migrations for your selected modules
3. Merge this PR and deploy
`;

    const prData = await ghJson(
      await ghFetch(`https://api.github.com/repos/${repo}/pulls`, ghToken, {
        method: "POST",
        body: JSON.stringify({
          title: `Install @pandotic/universal-cms (${preset} preset)`,
          body: prBody,
          head: branchName,
          base: defaultBranch,
        }),
      })
    );

    // 5. Record deployment
    await upsertPackageDeployment(supabase, {
      property_id: propertyId,
      package_name: "@pandotic/universal-cms",
      package_category: "cms",
      installed_version: null,
      latest_version: CMS_VERSION,
      pinned: false,
      enabled_modules: modules,
      bespoke_modules: [],
      preset,
      status: "pending",
      github_repo: repo,
      github_pr_url: prData.html_url,
      deployed_by: null,
      deployed_at: null,
      last_health_check_at: null,
      health_check_data: {},
    });

    await logPackageDeploymentEvent(supabase, {
      deployment_id: (await import("@pandotic/universal-cms/data/hub-package-deployments").then(
        (m) => m.getPackageDeployment(supabase, propertyId)
      ))?.id ?? "",
      property_id: propertyId,
      event_type: "installed",
      from_version: null,
      to_version: CMS_VERSION,
      modules_added: modules,
      modules_removed: [],
      notes: `CMS install PR created: ${prData.html_url}`,
      metadata: { pr_url: prData.html_url, branch: branchName },
      triggered_by: null,
    });

    // 6. Update property
    await updateProperty(supabase, propertyId, {
      enabled_modules: modules,
      preset,
    });

    return NextResponse.json({
      data: {
        prUrl: prData.html_url,
        branch: branchName,
        modules,
        preset,
      },
    });
  } catch (e) {
    return apiError(e);
  }
}
