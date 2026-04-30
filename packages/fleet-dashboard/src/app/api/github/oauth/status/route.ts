import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const token = request.cookies.get("github_token")?.value;

  if (!token) {
    return NextResponse.json({ authenticated: false });
  }

  try {
    // Verify token is valid by fetching user info
    const res = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `token ${token}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (!res.ok) {
      return NextResponse.json({ authenticated: false });
    }

    const user = await res.json();
    return NextResponse.json({
      authenticated: true,
      login: user.login,
      name: user.name,
      avatar_url: user.avatar_url,
    });
  } catch {
    return NextResponse.json({ authenticated: false });
  }
}
