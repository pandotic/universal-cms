import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { requirePlatformAdmin, getCurrentUserId } from "@/lib/middleware/admin-rbac";
import { apiError } from "@pandotic/universal-cms/middleware";
import { getBriefById } from "@pandotic/universal-cms/data/hub-social";
import Anthropic from "@anthropic-ai/sdk";

export async function POST(request: NextRequest) {
  try {
    const authClient = await createClient();
    const userId = await getCurrentUserId(authClient);

    const authError = await requirePlatformAdmin(authClient, userId ?? undefined);
    if (authError) return authError;

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY not configured" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { briefId, platforms, topic } = body;

    if (!platforms?.length || !topic) {
      return NextResponse.json(
        { error: "platforms and topic are required" },
        { status: 400 }
      );
    }

    // Load brand voice brief if provided
    let briefContext = "";
    if (briefId) {
      const supabase = await createAdminClient();
      const brief = await getBriefById(supabase, briefId);
      if (brief) {
        briefContext = `
Brand Voice Brief: "${brief.name}"
- Tone: ${brief.tone?.join(", ") || "Not specified"}
- Audience: ${brief.audience || "General"}
- Key Messages: ${brief.key_messages?.join("; ") || "None"}
- Do's: ${brief.dos?.join("; ") || "None"}
- Don'ts: ${brief.donts?.join("; ") || "None"}
`;
      }
    }

    const platformList = platforms.join(", ");

    const anthropic = new Anthropic({ apiKey });

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: `You are a social media content specialist. Generate social media posts for the following platforms: ${platformList}.
${briefContext}
Topic/Content to post about:
${topic}

For each platform, generate one optimized post. Follow platform-specific best practices:
- Twitter: concise, under 280 chars, punchy
- LinkedIn: professional, longer form, industry insight
- Instagram: visual-friendly caption, emoji-friendly
- Facebook: conversational, shareable
- TikTok: trendy, casual, hook-driven
- YouTube: descriptive, SEO-optimized title + description

Return ONLY a JSON array (no markdown, no code fences) where each item has:
{ "platform": string, "title": string | null, "body": string, "hashtags": string[] }`,
        },
      ],
    });

    const textContent = message.content.find((c) => c.type === "text");
    if (!textContent || textContent.type !== "text") {
      return NextResponse.json(
        { error: "No text response from AI" },
        { status: 500 }
      );
    }

    let generated;
    try {
      // Strip potential markdown code fences
      const cleaned = textContent.text
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();
      generated = JSON.parse(cleaned);
    } catch {
      return NextResponse.json(
        { error: "Failed to parse AI response", raw: textContent.text },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: generated });
  } catch (e) {
    return apiError(e);
  }
}
