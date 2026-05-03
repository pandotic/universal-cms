// Minimal structured logger — JSON lines on stdout, tagged with level + ts.
// Avoids pulling in pino so the runtime image stays small.

type Level = "debug" | "info" | "warn" | "error";

const LEVELS: Record<Level, number> = { debug: 10, info: 20, warn: 30, error: 40 };

let threshold: Level = "info";

export function setLogLevel(level: Level): void {
  threshold = level;
}

function emit(level: Level, msg: string, ctx?: Record<string, unknown>): void {
  if (LEVELS[level] < LEVELS[threshold]) return;
  const line = {
    ts: new Date().toISOString(),
    level,
    msg,
    ...(ctx ?? {}),
  };
  // Errors → stderr so Fly groups them separately
  const out = level === "error" ? process.stderr : process.stdout;
  out.write(`${JSON.stringify(line)}\n`);
}

export const log = {
  debug: (msg: string, ctx?: Record<string, unknown>) => emit("debug", msg, ctx),
  info:  (msg: string, ctx?: Record<string, unknown>) => emit("info", msg, ctx),
  warn:  (msg: string, ctx?: Record<string, unknown>) => emit("warn", msg, ctx),
  error: (msg: string, ctx?: Record<string, unknown>) => emit("error", msg, ctx),
};
