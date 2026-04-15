import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { requireHubRole, apiError } from "@pandotic/universal-cms/middleware";
import { getPropertyById } from "@pandotic/universal-cms/data/hub";
import {
  getPackageDeployment,
  updatePackageDeployment,
  logPackageDeploymentEvent,
} from "@pandotic/universal-cms/data/hub-package-deployments";
import { CMS_VERSION } from "@pandotic/universal-cms/version";

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

interface UpgradeResult {
  propertyId: string;
  propertyName: string;
  status: "upgraded" | "skipped" | "failed";
  prUrl?: string;
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    const authClient = await createClient();
    const authError = await requireHubRole(authClient, request, [
      "super_admin", "group_admin",
    ]);
    if (authError) return authError;

    const supabase = await createAdminClient();
    const { propertyIds, ghToken } = await request.json() as {
      propertyIds: string[];
      ghToken: string;
    };

    if (!propertyIds?.length || !ghToken) {
      return NextResponse.json(
        { error: "propertyIds and ghToken required" },
        { status: 400 }
      );
    }

    const results: UpgradeResult[] = [];

    for (const propertyId of propertyIds) {
      try {
        const property = await getPropertyById(supabase, propertyId);
        if (!property?.github_repo) {
          results.push({ propertyId, propertyName: property?.name ?? "Unknown", status: "skipped", error: "No GitHub repo" });
          continue;
        }

        const deployment = await getPackageDeployment(supabase, propertyId);
        if (!deployment || deployment.pinned) {
          results.push({ propertyId, propertyName: property.name, status: "skipped", error: deployment?.pinned ? "Version pinned" : "No deployment" });
          continue;
        }

        if (deployment.installed_version === CMS_VERSION) {
          results.push({ propertyId, propertyName: property.name, status: "skipped", error: "Already on latest" });
          continue;
        }

        const repo = property.github_repo;
        const fromVersion = deployment.installed_version ?? "unknown";

        // Get default branch
        const repoData = await ghJson(await ghFetch(`https://api.github.com/repos/${repo}`, ghToken));
        const defaultBranch = repoData.default_branch;
        const refData = await ghJson(
          await ghFetch(`https://api.github.com/repos/${repo}/git/ref/heads/${defaultBranch}`, ghToken)
        );

        // Create branch
        const branchName = `cms/upgrade-${CMS_VERSION}-${Date.now()}`;
        await ghJson(
          await ghFetch(`https://api.github.com/repos/${repo}/git/refs`, ghToken, {
            method: "POST",
            body: JSON.stringify({ ref: `refs/heads/${branchName}`, sha: refData.object.sha }),
          })
        );

        // Read current package.json
        const pkgRes = await ghFetch(`https://api.github.com/repos/${repo}/contents/package.json`, ghToken);
        const pkgData = await ghJson(pkgRes);
        const pkgContent = JSON.parse(Buffer.from(pkgData.content, "base64").toString("utf-8"));

        // Update CMS version
        if (pkgContent.dependencies?.["@pandotic/universal-cms"]) {
          pkgContent.dependencies["@pandotic/universal-cms"] = `^${CMS_VERSION}`;
        }

        // Write updated package.json
        await ghJson(
          await ghFetch(`https://api.github.com/repos/${repo}/contents/package.json`, ghToken, {
            method: "PUT",
            body: JSON.stringify({
              message: `Upgrade @pandotic/universal-cms to v${CMS_VERSION}`,
              content: Buffer.from(JSON.stringify(pkgContent, null, 2) + "\n").toString("base64"),
              sha: pkgData.sha,
              branch: branchName,
            }),
          })
        );

        // Create PR
        const prData = await ghJson(
          await ghFetch(`https://api.github.com/repos/${repo}/pulls`, ghToken, {
            method: "POST",
            body: JSON.stringify({
              title: `Upgrade @pandotic/universal-cms v${fromVersion} → v${CMS_VERSION}`,
              body: `## CMS Upgrade via Pandotic Hub\n\nUpgrades \`@pandotic/universal-cms\` from v${fromVersion} to v${CMS_VERSION}.\n\n### After merging\n1. Run \`pnpm install\` to update the lockfile\n2. Check for any breaking changes in the changelog\n3. Apply any new required migrations`,
              head: branchName,
              base: defaultBranch,
            }),
          })
        );

        // Record in DB
        await updatePackageDeployment(supabase, deployment.id, {
          latest_version: CMS_VERSION,
          status: "pending",
          github_pr_url: prData.html_url,
        });

        await logPackageDeploymentEvent(supabase, {
          deployment_id: deployment.id,
          property_id: propertyId,
          event_type: "upgraded",
          from_version: fromVersion,
          to_version: CMS_VERSION,
          modules_added: [],
          modules_removed: [],
          notes: `Upgrade PR: ${prData.html_url}`,
          metadata: { pr_url: prData.html_url, branch: branchName },
          triggered_by: null,
        });

        results.push({ propertyId, propertyName: property.name, status: "upgraded", prUrl: prData.html_url });
      } catch (e) {
        const property = await getPropertyById(supabase, propertyId);
        results.push({
          propertyId,
          propertyName: property?.name ?? "Unknown",
          status: "failed",
          error: e instanceof Error ? e.message : "Unknown error",
        });
      }
    }

    return NextResponse.json({ data: { results } });
  } catch (e) {
    return apiError(e);
  }
}
