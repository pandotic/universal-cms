import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  // Check for OAuth errors (user denied, etc.)
  if (error) {
    return NextResponse.redirect(
      `/fleet/onboard?oauth_error=${encodeURIComponent(
        errorDescription || error
      )}`
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      `/fleet/onboard?oauth_error=${encodeURIComponent("Missing code or state")}`
    );
  }

  // Validate state against cookie
  const cookieState = request.cookies.get("github_oauth_state")?.value;
  if (!cookieState || cookieState !== state) {
    return NextResponse.redirect(
      `/fleet/onboard?oauth_error=${encodeURIComponent("Invalid state")}`
    );
  }

  const clientId = process.env.GITHUB_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GITHUB_OAUTH_CLIENT_SECRET;
  const redirectUri = process.env.GITHUB_OAUTH_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    return NextResponse.redirect(
      `/fleet/onboard?oauth_error=${encodeURIComponent(
        "GitHub OAuth not configured"
      )}`
    );
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch(
      "https://github.com/login/oauth/access_token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          code,
          redirect_uri: redirectUri,
        }),
      }
    );

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      throw new Error(
        tokenData.error_description || "Failed to get access token"
      );
    }

    if (!tokenData.access_token) {
      throw new Error("No access token in response");
    }

    // Store token in httpOnly cookie
    const response = NextResponse.redirect("/fleet/onboard");

    response.cookies.set("github_token", tokenData.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    // Clear the state cookie
    response.cookies.delete("github_oauth_state");

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "OAuth callback failed";
    return NextResponse.redirect(
      `/fleet/onboard?oauth_error=${encodeURIComponent(message)}`
    );
  }
}
