import assessmentData from "@/data/esg-assessment.json";
import type { AssessmentData, AssessmentQuestion, Pillar } from "@/lib/types/assessment";

let _sbConfigured: boolean | null = null;
function sbReady(): boolean {
  if (_sbConfigured !== null) return _sbConfigured;
  _sbConfigured =
    !!process.env.SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY;
  return _sbConfigured;
}

async function getClient() {
  const { getSupabaseAdmin } = await import("@/lib/supabase/server");
  return getSupabaseAdmin();
}

export async function getAssessmentData(): Promise<AssessmentData> {
  if (!sbReady()) return assessmentData as AssessmentData;

  const sb = await getClient();
  const [{ data: questions }, { data: industries }, { data: regions }] =
    await Promise.all([
      sb
        .from("assessment_questions")
        .select("*")
        .eq("status", "active")
        .order("sort_order"),
      sb.from("assessment_industries").select("*").order("sort_order"),
      sb.from("assessment_regions").select("*").order("sort_order"),
    ]);

  return {
    questions: (questions ?? []).map(
      (q: Record<string, unknown>): AssessmentQuestion => ({
        id: q.id as string,
        pillar: q.pillar as Pillar,
        subcategory: q.subcategory as string,
        subcategoryLabel: q.subcategory_label as string,
        text: q.text as string,
        helpText: q.help_text as string | undefined,
        weight: q.weight as number,
        options: q.options as AssessmentQuestion["options"],
      }),
    ),
    industries: (industries ?? []).map((i: Record<string, unknown>) => ({
      value: i.value as string,
      label: i.label as string,
    })),
    regions: (regions ?? []).map((r: Record<string, unknown>) => ({
      value: r.value as string,
      label: r.label as string,
    })),
  };
}

export async function getQuestionsByPillar(
  pillar: Pillar,
): Promise<AssessmentQuestion[]> {
  const data = await getAssessmentData();
  return data.questions.filter((q) => q.pillar === pillar);
}

export async function getTotalQuestionCount(): Promise<number> {
  const data = await getAssessmentData();
  return data.questions.length;
}
