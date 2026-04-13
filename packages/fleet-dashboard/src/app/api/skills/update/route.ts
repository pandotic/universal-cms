import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { requireHubRole, apiError } from "@pandotic/universal-cms/middleware";
import { updateSkillPR } from "@pandotic/skill-library/deploy/github-pr";
import { getSkillContent } from "@pandotic/skill-library/data/manifest-sync";
import { getSkillById } from "@pandotic/skill-library/data/hub-skills";
import {
  getOutdatedDeployments,
  updateDeployment,
} from "@pandotic/skill-library/data/hub-skill-deployments";

export async function POST(request: NextRequest) {
  try {
    const authClient = await createClient();
    const authError = await requireHubRole(authClient, request, [
      "super_admin", "group_admin",
    ]);
    if (authError) return authError;

    const supabase = await createAdminClient();
    const body = await request.json();
    const { ghToken, skillId } = body as {
      ghToken: string;
      skillId?: string;
    };

    if (!ghToken) {
      return NextResponse.json({ error: "Missing ghToken" }, { status: 400 });
    }

    const outdated = await getOutdatedDeployments(supabase, skillId);
    if (outdated.length === 0) {
      return NextResponse.json({ data: { updated: 0, message: "All deployments are current" } });
    }

    // Group by repo
    const byRepo = new Map<string, typeof outdated>();
    for (const dep of outdated) {
      if (!dep.github_repo) continue;
      const group = byRepo.get(dep.github_repo) ?? [];
      group.push(dep);
      byRepo.set(dep.github_repo, group);
    }

    const results: { repo: string; prUrl?: string; error?: string }[] = [];

    for (const [repo, deps] of byRepo) {
      // Build skill content for PR
      const skills: { id: string; name: string; content: string; fromVersion: string; toVersion: string }[] = [];
      for (const dep of deps) {
        const skill = await getSkillById(supabase, dep.skill_id);
        if (!skill) continue;

        const content = skill.manifest_id
          ? getSkillContent(skill.manifest_id)
          : null;
        if (!content) continue;

        skills.push({
          id: skill.slug,
          name: skill.name,
          content,
          fromVersion: dep.deployed_version,
          toVersion: skill.version,
        });
      }

      if (skills.length === 0) continue;

      const result = await updateSkillPR({ ghToken, targetRepo: repo, skills });
      results.push({
        repo,
        prUrl: result.prUrl,
        error: result.error,
      });

      // Update deployment records
      if (result.success) {
        for (const dep of deps) {
          const skill = await getSkillById(supabase, dep.skill_id);
          if (skill) {
            await updateDeployment(supabase, dep.id, {
              deployed_version: skill.version,
              current_version: skill.version,
              github_pr_url: result.prUrl ?? undefined,
            });
          }
        }
      }
    }

    return NextResponse.json({
      data: { updated: results.filter((r) => r.prUrl).length, results },
    });
  } catch (e) {
    return apiError(e);
  }
}
