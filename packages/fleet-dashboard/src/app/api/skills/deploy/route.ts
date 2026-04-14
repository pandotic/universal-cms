import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { requireHubRole, apiError } from "@pandotic/universal-cms/middleware";
import { createSkillPR } from "@pandotic/skill-library/deploy/github-pr";
import { getSkillContent } from "@pandotic/skill-library/data/manifest-sync";
import { getSkillById } from "@pandotic/skill-library/data/hub-skills";
import { createDeployment, recordPRDeployment } from "@pandotic/skill-library/data/hub-skill-deployments";

export async function POST(request: NextRequest) {
  try {
    const authClient = await createClient();
    const authError = await requireHubRole(authClient, request, [
      "super_admin", "group_admin",
    ]);
    if (authError) return authError;

    const supabase = await createAdminClient();
    const body = await request.json();
    const { ghToken, targetRepo, skillIds, propertyId } = body as {
      ghToken: string;
      targetRepo: string;
      skillIds: string[];
      propertyId: string;
    };

    if (!ghToken || !targetRepo || !skillIds?.length || !propertyId) {
      return NextResponse.json(
        { error: "Missing required fields: ghToken, targetRepo, skillIds, propertyId" },
        { status: 400 }
      );
    }

    // Load skill content for each skill
    const skills: { id: string; name: string; content: string }[] = [];
    for (const skillId of skillIds) {
      const skill = await getSkillById(supabase, skillId);
      if (!skill) continue;

      const content = skill.manifest_id
        ? getSkillContent(skill.manifest_id)
        : null;

      if (content) {
        skills.push({ id: skill.slug, name: skill.name, content });
      }
    }

    if (skills.length === 0) {
      return NextResponse.json({ error: "No valid skills found" }, { status: 400 });
    }

    // Create GitHub PR
    const result = await createSkillPR({ ghToken, targetRepo, skills });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    // Record deployments in DB
    for (const skillId of skillIds) {
      const skill = await getSkillById(supabase, skillId);
      if (!skill) continue;

      const deployment = await createDeployment(supabase, {
        skill_id: skillId,
        property_id: propertyId,
        config_overrides: {},
        schedule: null,
        target_type: "custom",
        status: "active",
        deployed_version: skill.version,
        current_version: skill.version,
        pinned: false,
        github_pr_url: result.prUrl ?? null,
        github_repo: targetRepo,
        deployed_by: null,
      });
    }

    return NextResponse.json({
      data: { prUrl: result.prUrl, branch: result.branch, skillCount: skills.length },
    });
  } catch (e) {
    return apiError(e);
  }
}
