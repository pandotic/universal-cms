import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireHubRole, apiError } from "@pandotic/universal-cms/middleware";

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

    // Fetch user's repos from GitHub
    const res = await fetch("https://api.github.com/user/repos?per_page=100&sort=updated&affiliation=owner,collaborator,organization_member", {
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

    const repos = await res.json();

    const simplified = repos.map((repo: any) => ({
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
