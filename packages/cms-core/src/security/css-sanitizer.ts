/**
 * Sanitizes custom CSS to prevent XSS and other injection attacks.
 * Strips dangerous patterns while preserving valid CSS.
 */
export function sanitizeCss(css: string): string {
  let cleaned = css;

  // Strip <script and </script> tags
  cleaned = cleaned.replace(/<\/?script[^>]*>/gi, "");

  // Strip expression() calls (IE CSS expressions)
  cleaned = cleaned.replace(/expression\s*\(/gi, "");

  // Strip url(javascript:...) patterns
  cleaned = cleaned.replace(/url\s*\(\s*(['"]?\s*javascript\s*:)/gi, "url(");

  // Strip @import rules (prevent loading external resources)
  cleaned = cleaned.replace(/@import\s+[^;]+;?/gi, "");

  return cleaned;
}
