import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireHubRole, apiError } from "@pandotic/universal-cms/middleware";

const PER_PAGE = 100;
const MAX_PAGES = 20;

export async function GET(request: NextRequest) {
  try {
    const authClient = await createClient();
    const authError = await requireHubRole(authClient, request, [
      "super_admin", "group_admin",
    ]);
    if (authError) return authError;

    const { searchParams } = new URL(request.url);
    const ghToken = searchParams.get("token");

    if (!ghToken) {
      return NextResponse.json({ error: "GitHub token required" }, { status: 400 });
    }

    const all: any[] = [];
    for (let page = 1; page <= MAX_PAGES; page++) {
      const url = `https://api.github.com/user/repos?per_page=${PER_PAGE}&page=${page}&sort=updated&affiliation=owner,collaborator,organization_member`;
      const res = await fetch(url, {
        headers: {
          Authorization: `token ${ghToken}`,
          Accept: "application/vnd.github.v3+json",
        },
      });

      if (!res.ok) {
        return NextResponse.json(
          { error: `GitHub API error: ${res.status}` },
          { status: res.status }
        );
      }

      const batch = await res.json();
      if (!Array.isArray(batch) || batch.length === 0) break;
      all.push(...batch);
      if (batch.length < PER_PAGE) break;
    }

    const simplified = all.map((repo: any) => ({
      full_name: repo.full_name,
      name: repo.name,
      owner: repo.owner?.login,
      description: repo.description,
      language: repo.language,
      default_branch: repo.default_branch,
      private: repo.private,
      html_url: repo.html_url,
      updated_at: repo.updated_at,
    }));

    return NextResponse.json({ data: simplified });
  } catch (e) {
    return apiError(e);
  }
}
