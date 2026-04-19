// Tsup 8.x doesn't preserve `"use client"` directives across bundled output
// files. The error-logging client entry re-exports a React boundary +
// useEffect-based provider, so Next.js refuses to import it from a Server
// Component unless the bundle is tagged.
//
// Prepend the directive ourselves after build.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, "..");

const CLIENT_BUNDLES = [
  "dist/error-logging/index.js",
];

for (const rel of CLIENT_BUNDLES) {
  const file = resolve(rootDir, rel);
  if (!existsSync(file)) {
    console.warn(`[post-build] skipping ${rel} (not found)`);
    continue;
  }
  const original = readFileSync(file, "utf8");
  if (original.startsWith('"use client"') || original.startsWith("'use client'")) {
    continue;
  }
  writeFileSync(file, `"use client";\n${original}`);
  console.log(`[post-build] prepended "use client" to ${rel}`);
}
