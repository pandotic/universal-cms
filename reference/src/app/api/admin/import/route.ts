import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { requireAdmin, apiError } from "@/lib/api/auth";

export async function POST(request: NextRequest) {
  const authError = await requireAdmin(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { entityType, rows, mappings } = body as {
      entityType: string;
      rows: Record<string, string>[];
      mappings: { csvColumn: string; dbField: string }[];
    };

    if (!rows?.length || !mappings?.length) {
      return NextResponse.json(
        { error: "No data to import" },
        { status: 400 }
      );
    }

    const supabase = await getSupabaseAdmin();
    const activeMappings = mappings.filter((m) => m.dbField);
    const results = { success: 0, errors: 0, errorMessages: [] as string[] };

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const record: Record<string, unknown> = {};

      for (const mapping of activeMappings) {
        const value = row[mapping.csvColumn]?.trim();
        if (!value) continue;

        // Type coercion for known numeric fields
        if (["esg_score", "environmental_score", "social_score", "governance_score", "founded_year", "employees"].includes(mapping.dbField)) {
          const num = Number(value);
          if (isNaN(num)) {
            results.errors++;
            results.errorMessages.push(
              `Row ${i + 1}: "${row[activeMappings[0]?.csvColumn] || "unknown"}" - Invalid number for ${mapping.dbField}`
            );
            continue;
          }
          record[mapping.dbField] = num;
        } else if (mapping.dbField === "tags") {
          record[mapping.dbField] = value.split(",").map((t: string) => t.trim());
        } else {
          record[mapping.dbField] = value;
        }
      }

      // Generate slug if not provided
      if (!record.slug && record.name) {
        record.slug = String(record.name)
          .toLowerCase()
          .replace(/\s+/g, "-")
          .replace(/[^a-z0-9-]/g, "");
      }

      // Set entity type
      record.type = entityType;

      try {
        const { error } = await supabase
          .from("entities")
          .upsert(record, { onConflict: "slug" });

        if (error) {
          results.errors++;
          results.errorMessages.push(
            `Row ${i + 1}: "${record.name || "unknown"}" - ${error.message}`
          );
        } else {
          results.success++;
        }
      } catch (err) {
        results.errors++;
        results.errorMessages.push(
          `Row ${i + 1}: "${record.name || "unknown"}" - ${err instanceof Error ? err.message : "Unknown error"}`
        );
      }
    }

    return NextResponse.json({ data: results });
  } catch (e) {
    return apiError(e);
  }
}
