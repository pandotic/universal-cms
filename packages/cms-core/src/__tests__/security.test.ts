import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { validateEnv, validateEnvOrThrow, requiredCmsEnvVars, requiredServerEnvVars } from "../security/env-check";
import { sanitizeCss } from "../security/css-sanitizer";

describe("validateEnv", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("returns valid when all vars are set", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-key";
    const result = validateEnv(requiredCmsEnvVars);
    expect(result.valid).toBe(true);
    expect(result.missing).toEqual([]);
  });

  it("returns missing vars when not set", () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const result = validateEnv(requiredCmsEnvVars);
    expect(result.valid).toBe(false);
    expect(result.missing).toContain("NEXT_PUBLIC_SUPABASE_URL");
    expect(result.missing).toContain("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  });

  it("validates server env vars", () => {
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    const result = validateEnv(requiredServerEnvVars);
    expect(result.valid).toBe(false);
    expect(result.missing).toContain("SUPABASE_SERVICE_ROLE_KEY");
  });
});

describe("validateEnvOrThrow", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("throws when vars are missing", () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    expect(() => validateEnvOrThrow(requiredCmsEnvVars)).toThrow("Missing required environment variables");
  });

  it("does not throw when all vars are set", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-key";
    expect(() => validateEnvOrThrow(requiredCmsEnvVars)).not.toThrow();
  });
});

describe("sanitizeCss", () => {
  it("passes through valid CSS properties", () => {
    expect(sanitizeCss("color: red;")).toBe("color: red;");
  });

  it("strips dangerous content", () => {
    const result = sanitizeCss("background: url(javascript:alert(1))");
    expect(result).not.toContain("javascript:");
  });

  it("strips expression()", () => {
    const result = sanitizeCss("width: expression(document.body.clientWidth)");
    expect(result).not.toContain("expression(");
  });
});
