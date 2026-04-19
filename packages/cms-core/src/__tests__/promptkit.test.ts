import { describe, it, expect } from "vitest";
import { optimizePrompt } from "../promptkit/optimizers/index.js";
import type { PromptConfig } from "../types/promptkit.js";

const ROUGH_PROMPT =
  "Please help me write a function that fetches user data from an API. Don't forget to handle errors. I was hoping you could make it async and return the data.";

const ANALYTICAL_PROMPT =
  "Analyze the tradeoffs between using server components vs client components in Next.js for a dashboard that shows real-time data.";

function makeConfig(overrides: Partial<PromptConfig> = {}): PromptConfig {
  return {
    mode: "quick",
    target: { provider: "claude", model: "claude-sonnet-4-5" },
    rawPrompt: ROUGH_PROMPT,
    tone: "direct",
    outputMode: "single",
    ...overrides,
  };
}

// ─── Claude ────────────────────────────────────────────────────────────────

describe("Claude optimizer", () => {
  it("adds a role statement when none is present", () => {
    const result = optimizePrompt(makeConfig());
    expect(typeof result.prompt).toBe("string");
    expect((result.prompt as string).toLowerCase()).toMatch(/^you are/);
  });

  it("wraps multi-component prompts in XML", () => {
    const result = optimizePrompt(
      makeConfig({ rawPrompt: ANALYTICAL_PROMPT, tone: "direct" })
    );
    const text = result.prompt as string;
    expect(text).toContain("<instructions>");
    expect(text).toContain("</instructions>");
  });

  it("reframes negative instructions as positive", () => {
    const result = optimizePrompt(makeConfig());
    const text = result.prompt as string;
    // "Don't forget to handle errors" → should not contain "don't"
    expect(text.toLowerCase()).not.toMatch(/\bdon'?t\b/);
  });

  it("strips pleasantries in direct tone", () => {
    const result = optimizePrompt(makeConfig({ tone: "direct" }));
    const text = result.prompt as string;
    expect(text.toLowerCase()).not.toMatch(/\bplease\b/);
    expect(text.toLowerCase()).not.toMatch(/\bi was hoping\b/);
  });

  it("adds chain-of-thought trigger for complex analytical tasks", () => {
    const result = optimizePrompt(
      makeConfig({ rawPrompt: ANALYTICAL_PROMPT, tone: "direct" })
    );
    const text = result.prompt as string;
    expect(text.toLowerCase()).toContain("step by step");
  });

  it("does NOT use XML for Haiku", () => {
    const result = optimizePrompt(
      makeConfig({
        target: { provider: "claude", model: "claude-haiku-4-5" },
        rawPrompt: ANALYTICAL_PROMPT,
      })
    );
    const text = result.prompt as string;
    expect(text).not.toContain("<instructions>");
    expect(text).not.toContain("<context>");
  });

  it("includes notes array with at least one entry", () => {
    const result = optimizePrompt(makeConfig());
    expect(Array.isArray(result.notes)).toBe(true);
    expect(result.notes.length).toBeGreaterThan(0);
  });

  it("returns phased output as array of 3 strings", () => {
    const result = optimizePrompt(
      makeConfig({ outputMode: "phased", rawPrompt: ANALYTICAL_PROMPT })
    );
    expect(result.mode).toBe("phased");
    expect(Array.isArray(result.prompt)).toBe(true);
    expect((result.prompt as string[]).length).toBe(3);
  });

  it("injects Claude Code preamble when isClaudeCode is true", () => {
    const result = optimizePrompt(
      makeConfig({
        repo: {
          url: "https://github.com/pandotic/universal-cms",
          isClaudeCode: true,
          stack: "Next.js + Supabase",
        },
      })
    );
    const text = result.prompt as string;
    expect(text.toLowerCase()).toContain("claude code");
  });
});

// ─── Gemini ────────────────────────────────────────────────────────────────

describe("Gemini optimizer", () => {
  it("strips XML tags and converts to Markdown", () => {
    const xmlPrompt =
      "<context>Build a dashboard.</context><instructions>Write the nav component.</instructions>";
    const result = optimizePrompt(
      makeConfig({
        target: { provider: "gemini", model: "gemini-2.5-flash" },
        rawPrompt: xmlPrompt,
      })
    );
    const text = result.prompt as string;
    expect(text).not.toContain("<context>");
    expect(text).not.toContain("<instructions>");
    expect(text).toContain("## Task");
  });

  it("removes role-setting preamble", () => {
    const withRole = "You are a senior engineer. Write a caching layer.";
    const result = optimizePrompt(
      makeConfig({
        target: { provider: "gemini", model: "gemini-2.5-flash" },
        rawPrompt: withRole,
      })
    );
    const text = result.prompt as string;
    expect(text.toLowerCase()).not.toMatch(/^you are/);
  });

  it("adds context window invocation for Pro with long prompts", () => {
    const longPrompt = ANALYTICAL_PROMPT.repeat(5);
    const result = optimizePrompt(
      makeConfig({
        target: { provider: "gemini", model: "gemini-2.5-pro" },
        rawPrompt: longPrompt,
      })
    );
    const text = result.prompt as string;
    expect(text.toLowerCase()).toContain("context window");
  });

  it("adds thinking trigger for Pro + complex tasks", () => {
    const result = optimizePrompt(
      makeConfig({
        target: { provider: "gemini", model: "gemini-2.5-pro" },
        rawPrompt: ANALYTICAL_PROMPT,
      })
    );
    const text = result.prompt as string;
    expect(text.toLowerCase()).toContain("think carefully");
  });

  it("does NOT add thinking trigger for Flash", () => {
    const result = optimizePrompt(
      makeConfig({
        target: { provider: "gemini", model: "gemini-2.5-flash" },
        rawPrompt: ANALYTICAL_PROMPT,
      })
    );
    const text = result.prompt as string;
    expect(text.toLowerCase()).not.toContain("think carefully");
  });

  it("output does not contain XML tags", () => {
    const result = optimizePrompt(
      makeConfig({
        target: { provider: "gemini", model: "gemini-2.5-flash" },
        rawPrompt: ROUGH_PROMPT,
      })
    );
    const text = result.prompt as string;
    expect(text).not.toMatch(/<[a-z_]+>/);
  });
});

// ─── OpenAI ────────────────────────────────────────────────────────────────

describe("OpenAI optimizer", () => {
  it("adds role statement for GPT-4o", () => {
    const result = optimizePrompt(
      makeConfig({
        target: { provider: "openai", model: "gpt-4o" },
      })
    );
    const text = result.prompt as string;
    expect(text.toLowerCase()).toMatch(/^you are/);
  });

  it("does NOT add role statement for o3 (reasoning model)", () => {
    const result = optimizePrompt(
      makeConfig({
        target: { provider: "openai", model: "o3" },
        rawPrompt: ANALYTICAL_PROMPT,
      })
    );
    const text = result.prompt as string;
    expect(text.toLowerCase()).not.toMatch(/^you are/);
  });

  it("removes chain-of-thought instructions for o3", () => {
    const cotPrompt = "Think step by step. Analyze the tradeoffs of microservices vs monolith.";
    const result = optimizePrompt(
      makeConfig({
        target: { provider: "openai", model: "o3" },
        rawPrompt: cotPrompt,
      })
    );
    const text = result.prompt as string;
    expect(text.toLowerCase()).not.toContain("think step by step");
  });

  it("o3 output is shorter than Claude output for same prompt", () => {
    const claudeResult = optimizePrompt(makeConfig({ rawPrompt: ANALYTICAL_PROMPT }));
    const o3Result = optimizePrompt(
      makeConfig({
        target: { provider: "openai", model: "o3" },
        rawPrompt: ANALYTICAL_PROMPT,
      })
    );
    const claudeLen = (claudeResult.prompt as string).length;
    const o3Len = (o3Result.prompt as string).length;
    expect(o3Len).toBeLessThan(claudeLen);
  });

  it("strips XML for all OpenAI models", () => {
    const xmlPrompt =
      "<context>App context.</context><instructions>Write the handler.</instructions>";
    const result = optimizePrompt(
      makeConfig({
        target: { provider: "openai", model: "gpt-4o" },
        rawPrompt: xmlPrompt,
      })
    );
    const text = result.prompt as string;
    expect(text).not.toContain("<context>");
    expect(text).not.toContain("<instructions>");
  });

  it("adds output specification for GPT-4o", () => {
    const noFormatPrompt = "Write a function to sort an array of objects by a key.";
    const result = optimizePrompt(
      makeConfig({
        target: { provider: "openai", model: "gpt-4o" },
        rawPrompt: noFormatPrompt,
      })
    );
    const text = result.prompt as string;
    expect(text.toLowerCase()).toMatch(/no\s+(preamble|explanation)|return\s+only/);
  });
});

// ─── optimizePrompt integration ────────────────────────────────────────────

describe("optimizePrompt integration", () => {
  it("handles builder mode by assembling from sections", () => {
    const result = optimizePrompt({
      mode: "builder",
      target: { provider: "claude", model: "claude-sonnet-4-5" },
      goal: "Build a user auth system",
      constraints: "Use Supabase only. No custom JWT.",
      deliverable: "TypeScript implementation with tests",
      tone: "direct",
      outputMode: "single",
    });
    const text = result.prompt as string;
    expect(text).toContain("Build a user auth system");
    expect(text).toContain("Supabase");
  });

  it("returns empty prompt gracefully for unknown provider", () => {
    const result = optimizePrompt({
      mode: "quick",
      // @ts-expect-error testing unknown provider
      target: { provider: "unknown", model: "unknown-model" },
      rawPrompt: "hello",
      tone: "direct",
      outputMode: "single",
    });
    expect(result.prompt).toBe("hello");
    expect(result.notes).toEqual([]);
  });
});
