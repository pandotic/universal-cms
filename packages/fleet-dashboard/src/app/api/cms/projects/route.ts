import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getAllProjects,
  createProject,
} from "@pandotic/universal-cms/data/projects";

export async function GET() {
  try {
    const supabase = await createClient();
    const projects = await getAllProjects(supabase);
    return NextResponse.json({ projects });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to list projects" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { project } = await request.json();
    const created = await createProject(supabase, project);
    return NextResponse.json({ project: created }, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to create project" },
      { status: 500 },
    );
  }
}
