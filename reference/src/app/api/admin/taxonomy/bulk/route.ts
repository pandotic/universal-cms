import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { requireAdmin, apiError } from "@/lib/api/auth";
import {
  fromEntity,
  fromFramework,
  fromGlossaryTerm,
  fromCategory,
} from "@/lib/data/utils/map-fields";

const TYPE_TABLE_MAP: Record<string, string> = {
  entities: "entities",
  frameworks: "frameworks",
  glossary: "glossary_terms",
  categories: "categories",
};

/* eslint-disable @typescript-eslint/no-explicit-any */

function mapItem(type: string, item: any): Record<string, unknown> {
  switch (type) {
    case "entities":
      return fromEntity(item);
    case "frameworks":
      return fromFramework(item);
    case "glossary":
      return fromGlossaryTerm(item);
    case "categories":
      return fromCategory(item);
    default:
      return item;
  }
}

export async function POST(request: NextRequest) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const body = await request.json();
    const { type, operation, data } = body as {
      type: string;
      operation: string;
      data: any[];
    };

    if (!type || !operation || !Array.isArray(data)) {
      return NextResponse.json(
        { error: "Request body must include type, operation, and data array" },
        { status: 400 }
      );
    }

    if (operation !== "upsert") {
      return NextResponse.json(
        { error: `Unsupported operation: ${operation}` },
        { status: 400 }
      );
    }

    const table = TYPE_TABLE_MAP[type];
    if (!table) {
      return NextResponse.json(
        { error: `Unknown type: ${type}` },
        { status: 400 }
      );
    }

    const supabase = await getSupabaseAdmin();
    let inserted = 0;
    let updated = 0;
    const errors: string[] = [];

    // Map all items from camelCase to snake_case
    const mappedRows = data.map((item) => mapItem(type, item));

    // Upsert in batches to avoid payload limits
    const BATCH_SIZE = 500;
    for (let i = 0; i < mappedRows.length; i += BATCH_SIZE) {
      const batch = mappedRows.slice(i, i + BATCH_SIZE);

      const { data: upsertedData, error } = await supabase
        .from(table)
        .upsert(batch, { onConflict: "id" })
        .select("id");

      if (error) {
        errors.push(`Batch ${Math.floor(i / BATCH_SIZE)}: ${error.message}`);
      } else if (upsertedData) {
        // Count inserted vs updated based on total so far
        // Supabase upsert doesn't distinguish, so we approximate:
        // all are counted as upserted
        updated += upsertedData.length;
      }
    }

    // For entities, handle junction tables (entity_categories and entity_frameworks)
    if (type === "entities") {
      // Collect category relationships
      const categoryRows: { entity_id: string; category_id: string }[] = [];
      const frameworkRows: { entity_id: string; framework_id: string }[] = [];
      const entityIdsWithCategories: string[] = [];
      const entityIdsWithFrameworks: string[] = [];

      for (const item of data) {
        if (item.categoryIds && Array.isArray(item.categoryIds)) {
          entityIdsWithCategories.push(item.id);
          for (const catId of item.categoryIds) {
            categoryRows.push({ entity_id: item.id, category_id: catId });
          }
        }
        if (item.frameworkIds && Array.isArray(item.frameworkIds)) {
          entityIdsWithFrameworks.push(item.id);
          for (const fwId of item.frameworkIds) {
            frameworkRows.push({ entity_id: item.id, framework_id: fwId });
          }
        }
      }

      // Delete existing junction rows for affected entities, then re-insert
      if (entityIdsWithCategories.length > 0) {
        const { error: delErr } = await supabase
          .from("entity_categories")
          .delete()
          .in("entity_id", entityIdsWithCategories);
        if (delErr) errors.push(`entity_categories delete: ${delErr.message}`);

        if (categoryRows.length > 0) {
          const { error: insErr } = await supabase
            .from("entity_categories")
            .insert(categoryRows);
          if (insErr) errors.push(`entity_categories insert: ${insErr.message}`);
        }
      }

      if (entityIdsWithFrameworks.length > 0) {
        const { error: delErr } = await supabase
          .from("entity_frameworks")
          .delete()
          .in("entity_id", entityIdsWithFrameworks);
        if (delErr) errors.push(`entity_frameworks delete: ${delErr.message}`);

        if (frameworkRows.length > 0) {
          const { error: insErr } = await supabase
            .from("entity_frameworks")
            .insert(frameworkRows);
          if (insErr) errors.push(`entity_frameworks insert: ${insErr.message}`);
        }
      }
    }

    // Since Supabase upsert doesn't distinguish insert vs update,
    // report all as "updated" (the caller knows the semantics)
    inserted = 0;

    return NextResponse.json({ inserted, updated, errors });
  } catch (e) {
    return apiError(e);
  }
}
