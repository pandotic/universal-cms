// ─── GitHub PR Deployment ─────────────────────────────────────────────────
// Server-side service for deploying skills to repos via GitHub PRs.
// Ported from the pando-skillo web UI's createPR logic, enhanced with
// component bundling and version-aware updates.

import type { ManifestSkill } from "../types/index";

// ─── Types ────────────────────────────────────────────────────────────────

export interface CreateSkillPRParams {
  ghToken: string;
  targetRepo: string; // "owner/name"
  skills: { id: string; name: string; content: string }[];
  componentFiles?: { skillId: string; componentId: string; fileName: string; content: string }[];
}

export interface UpdateSkillPRParams {
  ghToken: string;
  targetRepo: string;
  skills: { id: string; name: string; content: string; fromVersion: string; toVersion: string }[];
}

export interface PRResult {
  success: boolean;
  prUrl?: string;
  branch?: string;
  error?: string;
}

export interface RepoSkillInfo {
  id: string;
  version: string | null;
  path: string;
}

// ─── GitHub API Helpers ───────────────────────────────────────────────────

async function ghFetch(
  url: string,
  ghToken: string,
  options: RequestInit = {}
): Promise<Response> {
  return fetch(url, {
    ...options,
    headers: {
      Authorization: `token ${ghToken}`,
      "Content-Type": "application/json",
      Accept: "application/vnd.github.v3+json",
      ...((options.headers as Record<string, string>) ?? {}),
    },
  });
}

async function ghJson<T>(url: string, ghToken: string, options?: RequestInit): Promise<T> {
  const res = await ghFetch(url, ghToken, options);
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GitHub API ${res.status}: ${body}`);
  }
  return res.json() as Promise<T>;
}

// ─── Create Skill PR ──────────────────────────────────────────────────────

export async function createSkillPR(params: CreateSkillPRParams): Promise<PRResult> {
  const { ghToken, targetRepo, skills, componentFiles } = params;
  const base = `https://api.github.com/repos/${targetRepo}`;

  try {
    // Get default branch SHA
    const repo = await ghJson<{ default_branch: string }>(base, ghToken);
    const ref = await ghJson<{ object: { sha: string } }>(
      `${base}/git/ref/heads/${repo.default_branch}`,
      ghToken
    );

    // Create feature branch
    const branch = `add-skills-${Date.now()}`;
    await ghFetch(`${base}/git/refs`, ghToken, {
      method: "POST",
      body: JSON.stringify({ ref: `refs/heads/${branch}`, sha: ref.object.sha }),
    });

    // Add each skill's SKILL.md
    for (const skill of skills) {
      const content = Buffer.from(skill.content).toString("base64");
      await ghFetch(`${base}/contents/.claude/skills/${skill.id}/SKILL.md`, ghToken, {
        method: "PUT",
        body: JSON.stringify({
          message: `Add ${skill.name} skill`,
          content,
          branch,
        }),
      });
    }

    // Add component files if any
    if (componentFiles) {
      for (const comp of componentFiles) {
        const content = Buffer.from(comp.content).toString("base64");
        await ghFetch(`${base}/contents/components/${comp.componentId}/${comp.fileName}`, ghToken, {
          method: "PUT",
          body: JSON.stringify({
            message: `Add ${comp.componentId} component for ${comp.skillId}`,
            content,
            branch,
          }),
        });
      }
    }

    // Open PR
    const names = skills.map((s) => s.name).join(", ");
    const body = [
      "## Skills added\n",
      ...skills.map((s) => `- **${s.name}**`),
      "\n---",
      "*Deployed via Pandotic Hub Skill Library*",
    ].join("\n");

    const pr = await ghJson<{ html_url?: string; message?: string }>(
      `${base}/pulls`,
      ghToken,
      {
        method: "POST",
        body: JSON.stringify({
          title: `Add skills: ${names}`,
          body,
          head: branch,
          base: repo.default_branch,
        }),
      }
    );

    if (pr.html_url) {
      return { success: true, prUrl: pr.html_url, branch };
    }
    return { success: false, error: pr.message || "PR creation failed" };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// ─── Update Skill PR ──────────────────────────────────────────────────────

export async function updateSkillPR(params: UpdateSkillPRParams): Promise<PRResult> {
  const { ghToken, targetRepo, skills } = params;
  const base = `https://api.github.com/repos/${targetRepo}`;

  try {
    const repo = await ghJson<{ default_branch: string }>(base, ghToken);
    const ref = await ghJson<{ object: { sha: string } }>(
      `${base}/git/ref/heads/${repo.default_branch}`,
      ghToken
    );

    const branch = `update-skills-${Date.now()}`;
    await ghFetch(`${base}/git/refs`, ghToken, {
      method: "POST",
      body: JSON.stringify({ ref: `refs/heads/${branch}`, sha: ref.object.sha }),
    });

    for (const skill of skills) {
      // Get existing file SHA (needed for updates)
      const filePath = `.claude/skills/${skill.id}/SKILL.md`;
      let existingSha: string | undefined;
      try {
        const existing = await ghJson<{ sha: string }>(
          `${base}/contents/${filePath}?ref=${repo.default_branch}`,
          ghToken
        );
        existingSha = existing.sha;
      } catch {
        // File doesn't exist yet — will be created
      }

      const content = Buffer.from(skill.content).toString("base64");
      await ghFetch(`${base}/contents/${filePath}`, ghToken, {
        method: "PUT",
        body: JSON.stringify({
          message: `Update ${skill.name} skill: v${skill.fromVersion} → v${skill.toVersion}`,
          content,
          branch,
          ...(existingSha ? { sha: existingSha } : {}),
        }),
      });
    }

    const names = skills.map((s) => `${s.name} (v${s.toVersion})`).join(", ");
    const body = [
      "## Skills updated\n",
      ...skills.map(
        (s) => `- **${s.name}**: v${s.fromVersion} → v${s.toVersion}`
      ),
      "\n---",
      "*Updated via Pandotic Hub Skill Library*",
    ].join("\n");

    const pr = await ghJson<{ html_url?: string; message?: string }>(
      `${base}/pulls`,
      ghToken,
      {
        method: "POST",
        body: JSON.stringify({
          title: `Update skills: ${names}`,
          body,
          head: branch,
          base: repo.default_branch,
        }),
      }
    );

    if (pr.html_url) {
      return { success: true, prUrl: pr.html_url, branch };
    }
    return { success: false, error: pr.message || "PR creation failed" };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// ─── List Repo Skills ─────────────────────────────────────────────────────

export async function listRepoSkills(
  ghToken: string,
  repo: string
): Promise<RepoSkillInfo[]> {
  const base = `https://api.github.com/repos/${repo}`;

  try {
    const contents = await ghJson<{ name: string; type: string; path: string }[]>(
      `${base}/contents/.claude/skills`,
      ghToken
    );

    const skills: RepoSkillInfo[] = [];
    for (const item of contents) {
      if (item.type !== "dir") continue;

      // Try to read version from SKILL.md frontmatter
      let version: string | null = null;
      try {
        const file = await ghJson<{ content: string; encoding: string }>(
          `${base}/contents/${item.path}/SKILL.md`,
          ghToken
        );
        const decoded = Buffer.from(file.content, "base64").toString("utf8");
        const versionMatch = decoded.match(/^---[\s\S]*?version:\s*"?([^"\n]+)"?[\s\S]*?---/);
        if (versionMatch) version = versionMatch[1].trim();
      } catch {
        // SKILL.md not found or unreadable
      }

      skills.push({ id: item.name, version, path: item.path });
    }

    return skills;
  } catch {
    return [];
  }
}
