import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ success: true });

  // Clear the GitHub token cookie
  response.cookies.delete("github_token");

  return response;
}
