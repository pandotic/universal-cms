import { describe, it, expect } from "vitest";
import {
  parseLongFormInput,
  buildLongFormKickoff,
  extractLongFormPayload,
} from "../agents/long-form-writer.js";
import type { ClaimedRun } from "../poll.js";

function makeRun(input: Record<string, unknown>): ClaimedRun {
  return {
    run_id: "run-1",
    agent_id: "agent-1",
    agent_slug: "marketing-long-form-writer",
    agent_type: "long_form_writer",
    managed_agent_id: "agt_test",
    managed_agent_version: 1,
    property_id: "prop-1",
    input,
  };
}

describe("parseLongFormInput", () => {
  it("requires topic", () => {
    expect(() => parseLongFormInput(makeRun({ target_keyword: "x" }))).toThrow(
      /topic is required/
    );
  });

  it("requires target_keyword", () => {
    expect(() => parseLongFormInput(makeRun({ topic: "x" }))).toThrow(
      /target_keyword is required/
    );
  });

  it("accepts valid input and applies defaults", () => {
    const parsed = parseLongFormInput(
      makeRun({ topic: "Hello", target_keyword: "hello world" })
    );
    expect(parsed.topic).toBe("Hello");
    expect(parsed.target_keyword).toBe("hello world");
    expect(parsed.word_count_target).toBe(2000);
    expect(parsed.secondary_keywords).toEqual([]);
  });

  it("uses run.property_id when input.property_id is missing", () => {
    const parsed = parseLongFormInput(
      makeRun({ topic: "x", target_keyword: "y" })
    );
    expect(parsed.property_id).toBe("prop-1");
  });
});

describe("buildLongFormKickoff", () => {
  it("includes the topic and keyword in the kickoff", () => {
    const text = buildLongFormKickoff(
      makeRun({
        topic: "Toxin-free sunscreen",
        target_keyword: "toxin free sunscreen",
      })
    );
    expect(text).toContain("Topic: Toxin-free sunscreen");
    expect(text).toContain("Target keyword: toxin free sunscreen");
    expect(text).toContain("end your turn");
  });

  it("serializes brand_voice into the prompt", () => {
    const text = buildLongFormKickoff(
      makeRun({
        topic: "x",
        target_keyword: "y",
        brand_voice: { tone: ["confident"] },
      })
    );
    expect(text).toContain('"tone"');
    expect(text).toContain("confident");
  });
});

describe("extractLongFormPayload", () => {
  it("extracts payload from a fenced json block", () => {
    const text = [
      "Here you go:",
      "```json",
      JSON.stringify({
        title: "T",
        excerpt: "E",
        body: "B",
        metadata: { brief: "ok" },
      }),
      "```",
    ].join("\n");
    const payload = extractLongFormPayload(text);
    expect(payload.title).toBe("T");
    expect(payload.excerpt).toBe("E");
    expect(payload.body).toBe("B");
    expect(payload.metadata).toEqual({ brief: "ok" });
  });

  it("falls back to parsing the whole message when no fence is present", () => {
    const text = JSON.stringify({ title: "T", excerpt: "E", body: "B" });
    const payload = extractLongFormPayload(text);
    expect(payload.title).toBe("T");
  });

  it("throws when the JSON is invalid", () => {
    expect(() => extractLongFormPayload("```json\n{not json}\n```")).toThrow(
      /did not contain valid JSON/
    );
  });

  it("throws when required fields are missing", () => {
    const text = "```json\n" + JSON.stringify({ title: "" }) + "\n```";
    expect(() => extractLongFormPayload(text)).toThrow(/title is required/);
  });
});
