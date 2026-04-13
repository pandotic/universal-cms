import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    "types/index": "src/types/index.ts",
    "data/hub-skills": "src/data/hub-skills.ts",
    "data/hub-skill-deployments": "src/data/hub-skill-deployments.ts",
    "data/manifest-sync": "src/data/manifest-sync.ts",
    "deploy/index": "src/deploy/index.ts",
    "deploy/github-pr": "src/deploy/github-pr.ts",
    "skills/marketing/index": "src/skills/marketing/index.ts",
  },
  format: ["esm"],
  dts: true,
  clean: true,
  splitting: true,
  treeshake: true,
  external: [
    "@supabase/supabase-js",
    "@pandotic/universal-cms",
  ],
});
