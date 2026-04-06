import { NextRequest, NextResponse } from "next/server";

interface RateLimitConfig {
  windowMs: number;
  max: number;
}

const stores = new Map<string, Map<string, number[]>>();

function getStore(name: string): Map<string, number[]> {
  let store = stores.get(name);
  if (!store) {
    store = new Map();
    stores.set(name, store);
  }
  return store;
}

/**
 * Create a rate limiter for an API route.
 *
 * Usage:
 *   const limiter = createRateLimiter("admin-api", { windowMs: 60_000, max: 60 });
 *   export async function POST(request: NextRequest) {
 *     const limited = limiter(request);
 *     if (limited) return limited;
 *     // ...
 *   }
 */
export function createRateLimiter(
  name: string,
  config: RateLimitConfig
): (request: NextRequest) => NextResponse | null {
  const store = getStore(name);

  return (request: NextRequest): NextResponse | null => {
    const ip = getClientIp(request);
    const now = Date.now();
    const timestamps = store.get(ip) ?? [];
    const recent = timestamps.filter((t) => now - t < config.windowMs);
    recent.push(now);
    store.set(ip, recent);

    if (recent.length > config.max) {
      return NextResponse.json(
        { error: "Too many requests" },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil(config.windowMs / 1000)),
          },
        }
      );
    }

    return null;
  };
}

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

/** Pre-configured limiters */
export const authLimiter = createRateLimiter("auth", {
  windowMs: 60_000,
  max: 10,
});

export const adminApiLimiter = createRateLimiter("admin-api", {
  windowMs: 60_000,
  max: 60,
});
