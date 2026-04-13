#!/usr/bin/env -S npx ts-node

/**
 * Admin UI Setup CLI
 *
 * Interactive command-line tool to quickly set up @pandotic/admin-ui in a Next.js project.
 *
 * Usage:
 *   npx @pandotic/universal-cms setup-admin
 *
 * Features:
 * - Interactive feature selection
 * - Auto-detect Next.js project structure
 * - Generate admin config file
 * - Create admin layout scaffold
 * - Provide environment variable checklist
 */

import * as fs from "fs";
import * as path from "path";
import * as readline from "readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

interface AdminSetupConfig {
  projectName: string;
  features: {
    users: boolean;
    organizations: boolean;
    featureFlags: boolean;
    auditLog: boolean;
    sso: boolean;
    apiKeys: boolean;
    bulkOperations: boolean;
  };
  preset: "minimal" | "standard" | "enterprise";
}

async function main() {
  console.log("\n🚀 Admin UI Setup Wizard\n");

  // Step 1: Project detection
  console.log("📁 Detecting Next.js project structure...\n");
  const projectRoot = process.cwd();
  const packageJsonPath = path.join(projectRoot, "package.json");

  if (!fs.existsSync(packageJsonPath)) {
    console.error(
      "❌ Error: package.json not found. Please run this from your Next.js project root.\n"
    );
    process.exit(1);
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
  const projectName = packageJson.name || "my-app";

  console.log(`✅ Found project: ${projectName}\n`);

  // Step 2: Feature selection
  console.log("📋 Choose your admin features:\n");
  console.log("1. Minimal (users + organizations)");
  console.log("2. Standard (minimal + feature-flags + audit-log)");
  console.log("3. Enterprise (standard + SSO + API keys + bulk operations)\n");

  const preset = await question("Select preset (1-3): ");
  let config: AdminSetupConfig = {
    projectName,
    preset: "standard" as const,
    features: {
      users: true,
      organizations: true,
      featureFlags: false,
      auditLog: false,
      sso: false,
      apiKeys: false,
      bulkOperations: false,
    },
  };

  if (preset === "1") {
    config.preset = "minimal";
  } else if (preset === "2") {
    config.preset = "standard";
    config.features.featureFlags = true;
    config.features.auditLog = true;
  } else if (preset === "3") {
    config.preset = "enterprise";
    config.features.featureFlags = true;
    config.features.auditLog = true;
    config.features.sso = true;
    config.features.apiKeys = true;
    config.features.bulkOperations = true;
  }

  console.log(`\n✅ Selected ${config.preset} preset\n`);

  // Step 3: Confirmation
  const confirmed = await question(
    "Continue with setup? This will create/modify files. (y/n): "
  );

  if (confirmed.toLowerCase() !== "y") {
    console.log("\n⏹️  Setup cancelled.\n");
    rl.close();
    return;
  }

  // Step 4: Generate files
  console.log("\n📝 Generating configuration files...\n");

  const srcDir = path.join(projectRoot, "src");
  if (!fs.existsSync(srcDir)) {
    fs.mkdirSync(srcDir, { recursive: true });
  }

  const configDir = path.join(srcDir, "config");
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }

  // Create admin-config.ts
  const adminConfigPath = path.join(configDir, "admin-config.ts");
  const adminConfigContent = generateAdminConfig(config);
  fs.writeFileSync(adminConfigPath, adminConfigContent);
  console.log(`✅ Created: ${path.relative(projectRoot, adminConfigPath)}`);

  // Create RBAC middleware
  const middlewareDir = path.join(srcDir, "lib", "middleware");
  if (!fs.existsSync(middlewareDir)) {
    fs.mkdirSync(middlewareDir, { recursive: true });
  }

  const rbacPath = path.join(middlewareDir, "admin-rbac.ts");
  if (!fs.existsSync(rbacPath)) {
    fs.writeFileSync(rbacPath, generateAdminRbac());
    console.log(`✅ Created: ${path.relative(projectRoot, rbacPath)}`);
  } else {
    console.log(`⏭️  Skipped: ${path.relative(projectRoot, rbacPath)} (already exists)`);
  }

  // Create Supabase client helper
  const supabaseHelperPath = path.join(srcDir, "lib", "supabase.ts");
  if (!fs.existsSync(supabaseHelperPath)) {
    fs.writeFileSync(supabaseHelperPath, generateSupabaseHelper());
    console.log(`✅ Created: ${path.relative(projectRoot, supabaseHelperPath)}`);
  } else {
    console.log(
      `⏭️  Skipped: ${path.relative(projectRoot, supabaseHelperPath)} (already exists)`
    );
  }

  // Step 5: Next steps
  console.log("\n✅ Setup complete!\n");
  console.log("📋 Next steps:\n");
  console.log("1. Install dependencies:");
  console.log("   npm install @pandotic/admin-ui @pandotic/admin-core\n");

  console.log("2. Set up environment variables:");
  console.log("   Create .env.local with:");
  console.log("   NEXT_PUBLIC_SUPABASE_URL=your_url");
  console.log("   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key\n");

  console.log("3. Apply database migrations:");
  console.log("   - Visit docs/ADMIN_UI_INTEGRATION_GUIDE.md");
  console.log("   - Run migrations in Supabase SQL editor\n");

  console.log("4. Create admin pages:");
  console.log("   - src/app/admin/layout.tsx");
  console.log("   - src/app/admin/page.tsx");
  console.log("   - src/app/admin/users/page.tsx\n");

  console.log("5. Reference example:");
  console.log("   See template/admin-integrated/ in monorepo\n");

  rl.close();
}

function generateAdminConfig(config: AdminSetupConfig): string {
  return `import type { AdminConfig } from "@pandotic/admin-ui";

/**
 * Admin UI configuration for ${config.projectName}
 *
 * Preset: ${config.preset.toUpperCase()}
 * Generated by: npx @pandotic/universal-cms setup-admin
 *
 * Enable/disable features to customize your admin dashboard.
 * Disabled features are automatically tree-shaken from your bundle.
 */
export const adminConfig: AdminConfig = {
  features: {
    // Core features
    users: ${config.features.users},
    organizations: ${config.features.organizations},

    // Management features
    featureFlags: ${config.features.featureFlags},
    auditLog: ${config.features.auditLog},

    // Enterprise features
    sso: ${config.features.sso},
    apiKeys: ${config.features.apiKeys},
    bulkOperations: ${config.features.bulkOperations},
  },
};

/**
 * Check if a feature is enabled
 */
export function isFeatureEnabled(
  feature: keyof AdminConfig["features"]
): boolean {
  return adminConfig.features[feature] === true;
}

/**
 * Get all enabled features
 */
export function getEnabledFeatures(): (keyof AdminConfig["features"])[] {
  return Object.entries(adminConfig.features)
    .filter(([_, enabled]) => enabled)
    .map(([feature]) => feature as keyof AdminConfig["features"]);
}
`;
}

function generateAdminRbac(): string {
  return `import { NextResponse } from "next/server";
import { isPlatformAdmin } from "@pandotic/admin-core/rbac";
import type { SupabaseClientAdapter } from "@pandotic/admin-core/types";
import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Middleware for protecting API routes with platform admin check
 */
export async function requirePlatformAdmin(
  supabase: SupabaseClient,
  userId?: string
): Promise<NextResponse | null> {
  if (!userId) {
    return NextResponse.json(
      { error: "Unauthorized: User ID required" },
      { status: 401 }
    );
  }

  const isAdmin = await isPlatformAdmin(
    supabase as unknown as SupabaseClientAdapter,
    userId
  );

  if (!isAdmin) {
    return NextResponse.json(
      { error: "Forbidden: Platform admin access required" },
      { status: 403 }
    );
  }

  return null;
}

/**
 * Get current user ID from auth
 */
export async function getCurrentUserId(
  supabase: SupabaseClient | SupabaseClientAdapter
): Promise<string | null> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user?.id ?? null;
  } catch {
    return null;
  }
}
`;
}

function generateSupabaseHelper(): string {
  return `import { createBrowserClient } from "@supabase/ssr";

/**
 * Create a Supabase client for browser/client-side usage
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
`;
}

main().catch(console.error);
