import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { requireHubRole, apiError } from "@pandotic/universal-cms/middleware";
import { processSkillUpload } from "@pandotic/skill-library/data/skill-upload";
import type { ComponentFile } from "@pandotic/skill-library/data/skill-upload";
import { syncManifestToDb } from "@pandotic/skill-library/data/manifest-sync";
import JSZip from "jszip";

const MAX_MD_SIZE = 1 * 1024 * 1024; // 1MB
const MAX_ZIP_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_EXTENSIONS = /\.(jsx?|tsx?|css|md)$/;

export async function POST(request: NextRequest) {
  try {
    const authClient = await createClient();
    const authError = await requireHubRole(authClient, request, [
      "super_admin",
      "group_admin",
    ]);
    if (authError) return authError;

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const syncToDb = formData.get("syncToDb") === "true";

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    const fileName = file.name.toLowerCase();
    let skillMd: string;
    let componentFiles: ComponentFile[] = [];

    if (fileName.endsWith(".zip")) {
      // Validate zip size
      if (file.size > MAX_ZIP_SIZE) {
        return NextResponse.json(
          { error: "Zip file exceeds 10MB limit" },
          { status: 400 }
        );
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const zip = await JSZip.loadAsync(buffer);

      // Find SKILL.md at root of zip
      const skillFile =
        zip.file("SKILL.md") ??
        zip.file(/^[^/]+\/SKILL\.md$/)?.[0]; // also check one level deep

      if (!skillFile) {
        return NextResponse.json(
          { error: "Zip must contain a SKILL.md file at its root" },
          { status: 400 }
        );
      }

      skillMd = await skillFile.async("string");

      // Extract component files from components/ directory
      const componentPrefix = skillFile.name.includes("/")
        ? skillFile.name.split("/")[0] + "/components/"
        : "components/";

      zip.forEach((relativePath, entry) => {
        if (
          !entry.dir &&
          relativePath.startsWith(componentPrefix) &&
          ALLOWED_EXTENSIONS.test(relativePath)
        ) {
          const name = relativePath.slice(componentPrefix.length);
          // Skip nested directories or path traversal
          if (!name.includes("/") && !name.includes("..")) {
            // We'll read these synchronously after the loop
            componentFiles.push({ name, content: "" });
          }
        }
      });

      // Read component file contents
      for (const cf of componentFiles) {
        const path = componentPrefix + cf.name;
        const entry = zip.file(path);
        if (entry) {
          cf.content = await entry.async("string");
        }
      }

      // Filter out any that failed to read
      componentFiles = componentFiles.filter((cf) => cf.content.length > 0);
    } else if (fileName.endsWith(".md")) {
      if (file.size > MAX_MD_SIZE) {
        return NextResponse.json(
          { error: "Markdown file exceeds 1MB limit" },
          { status: 400 }
        );
      }
      skillMd = await file.text();
    } else {
      return NextResponse.json(
        { error: "File must be a .md or .zip file" },
        { status: 400 }
      );
    }

    // Process the upload
    const result = processSkillUpload(skillMd, componentFiles);

    // Optionally sync to Supabase DB
    if (syncToDb) {
      const supabase = await createAdminClient();
      await syncManifestToDb(supabase);
    }

    return NextResponse.json({ data: result });
  } catch (e) {
    return apiError(e);
  }
}
