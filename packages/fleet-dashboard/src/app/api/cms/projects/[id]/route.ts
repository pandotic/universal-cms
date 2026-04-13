import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getProjectById,
  updateProject,
  deleteProject,
  getProjectSections,
  upsertProjectSection,
} from "@pandotic/universal-cms/data/projects";
import type { SectionType } from "@pandotic/universal-cms/types/projects";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();
    const project = await getProjectById(supabase, id);
    if (!project) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const sections = await getProjectSections(supabase, id);
    return NextResponse.json({ project, sections });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to load project" },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();
    const { project, sections } = await request.json();

    const updated = await updateProject(supabase, id, project);

    if (sections && Array.isArray(sections)) {
      for (const section of sections) {
        if (section.content) {
          await upsertProjectSection(supabase, {
            project_id: id,
            section_type: section.section_type as SectionType,
            title: section.title || section.section_type,
            content: section.content,
            sort_order: section.sort_order || 0,
          });
        }
      }
    }

    return NextResponse.json({ project: updated });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to update project" },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();
    await deleteProject(supabase, id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to delete project" },
      { status: 500 },
    );
  }
}
