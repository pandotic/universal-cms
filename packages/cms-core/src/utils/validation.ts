/**
 * Validation utilities for critical data fields
 */

/**
 * Validates if a string is a valid cron expression (basic validation)
 * Supports standard 5-field cron format: minute hour day month weekday
 * Regex pattern matches:
 * - Individual values (0-59 for minute, 0-23 for hour, 1-31 for day, 1-12 for month, 0-6 for weekday)
 * - Wildcards (asterisk)
 * - Ranges (e.g., 1-5)
 * - Steps (e.g., asterisk/15, 1-30 with step)
 */
export function isValidCronExpression(cron: string | null | undefined): boolean {
  if (!cron) return true; // Null/undefined is valid (optional schedule)

  const cronRegex =
    /^(\*|(\d{1,2})(,\d{1,2})*|(\d{1,2})-(\d{1,2})(\/\d{1,2})?|\*\/\d{1,2})\s+(\*|(\d{1,2})(,\d{1,2})*|(\d{1,2})-(\d{1,2})(\/\d{1,2})?|\*\/\d{1,2})\s+(\*|([1-9]|[12]\d|3[01])(,([1-9]|[12]\d|3[01]))*|([1-9]|[12]\d|3[01])-([1-9]|[12]\d|3[01])(\/\d{1,2})?|\*\/([1-9]|[12]\d|3[01]))\s+(\*|([1-9]|1[0-2])(,([1-9]|1[0-2]))*|([1-9]|1[0-2])-([1-9]|1[0-2])(\/\d{1,2})?|\*\/([1-9]|1[0-2]))\s+(\*|[0-6](,[0-6])*|[0-6]-[0-6](\/\d{1,2})?|\*\/[0-6])$/;

  return cronRegex.test(cron.trim());
}

/**
 * Validates if a string is a valid slug (alphanumeric, hyphens, underscores)
 * Used for agent slugs and brief names to ensure they're URL-safe
 */
export function isValidSlug(slug: string): boolean {
  const slugRegex = /^[a-z0-9_-]+$/i;
  return slugRegex.test(slug) && slug.length > 0 && slug.length <= 255;
}

/**
 * Validates if an email address follows basic format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validates if a URL is properly formatted
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validates array of hashtags (no duplicates, valid format)
 */
export function validateHashtags(hashtags: string[]): boolean {
  if (!Array.isArray(hashtags)) return false;

  const seen = new Set<string>();
  for (const tag of hashtags) {
    if (typeof tag !== 'string') return false;
    if (tag.length === 0 || tag.length > 255) return false;
    if (tag.toLowerCase() !== tag) return false; // Should be lowercase
    if (!/^[a-z0-9_]+$/.test(tag)) return false; // Alphanumeric + underscore only

    if (seen.has(tag)) return false; // No duplicates
    seen.add(tag);
  }

  return true;
}

/**
 * Validates array of URLs (all should be valid HTTP/HTTPS)
 */
export function validateMediaUrls(urls: string[]): boolean {
  if (!Array.isArray(urls)) return false;

  const seen = new Set<string>();
  for (const url of urls) {
    if (typeof url !== 'string') return false;
    if (!isValidUrl(url)) return false;
    if (!url.startsWith('http://') && !url.startsWith('https://')) return false;

    if (seen.has(url)) return false; // No duplicates
    seen.add(url);
  }

  return true;
}

/**
 * Validates that timestamp is in the future
 */
export function isFutureTimestamp(timestamp: string): boolean {
  try {
    const date = new Date(timestamp);
    return date > new Date();
  } catch {
    return false;
  }
}

/**
 * Validates text length constraints
 */
export function validateTextLength(
  text: string,
  minLength: number = 1,
  maxLength: number = 65535
): boolean {
  return text.length >= minLength && text.length <= maxLength;
}

/**
 * Validates non-empty string arrays
 */
export function validateStringArray(arr: unknown, minItems: number = 0): boolean {
  if (!Array.isArray(arr)) return false;
  if (arr.length < minItems) return false;

  return arr.every(item => typeof item === 'string' && item.length > 0);
}
