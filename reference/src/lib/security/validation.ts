import { z } from "zod";
import { NextResponse } from "next/server";

/**
 * Validate a request body against a Zod schema.
 * Returns the parsed data or a NextResponse 400 error.
 */
export function validateBody<T extends z.ZodType>(
  schema: T,
  data: unknown
): { data: z.infer<T>; error: null } | { data: null; error: NextResponse } {
  const result = schema.safeParse(data);
  if (!result.success) {
    return {
      data: null,
      error: NextResponse.json(
        {
          error: "Validation failed",
          details: result.error.flatten().fieldErrors,
        },
        { status: 400 }
      ),
    };
  }
  return { data: result.data, error: null };
}

// --- Schemas for admin API routes ---

export const createUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: z
    .enum(["admin", "editor", "moderator"])
    .optional(),
});

export const revalidateSchema = z.object({
  secret: z.string().min(1, "Secret is required"),
  paths: z
    .array(z.string().startsWith("/", "Paths must start with /"))
    .min(1, "At least one path is required"),
});
