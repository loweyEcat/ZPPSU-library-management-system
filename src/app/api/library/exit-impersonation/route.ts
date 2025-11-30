import { NextResponse } from "next/server";

import { getCurrentSession, setSessionCookie, clearSessionCookie } from "@/lib/auth-library";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { hashToken } from "@/lib/tokens";

const ORIGINAL_SESSION_COOKIE_NAME = "original_admin_session";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const originalToken = cookieStore.get(ORIGINAL_SESSION_COOKIE_NAME)?.value;

  if (!originalToken) {
    return NextResponse.json(
      {
        message: "No original session found. You are not in impersonation mode.",
      },
      { status: 400 }
    );
  }

  try {
    // Verify original session still exists and is valid
    const tokenHash = hashToken(originalToken);
    const now = new Date();

    const originalSession = await prisma.lib_sessions.findUnique({
      where: { token_hash: tokenHash },
      include: {
        user: true,
      },
    });

    if (!originalSession || originalSession.expires_at <= now) {
      // Original session expired, clear cookies and redirect to login
      cookieStore.delete(ORIGINAL_SESSION_COOKIE_NAME);
      await clearSessionCookie();
      
      return NextResponse.json(
        {
          message: "Original session expired. Please login again.",
          redirectUrl: "/login",
        },
        { status: 401 }
      );
    }

    // Restore original session
    await setSessionCookie(originalToken, originalSession.expires_at);
    
    // Clear the original session cookie
    cookieStore.delete(ORIGINAL_SESSION_COOKIE_NAME);

    // Determine redirect URL based on original user role
    let redirectUrl = "/admin";
    if (originalSession.user.user_role === "Super_Admin" || originalSession.user.user_role === "Admin") {
      redirectUrl = "/admin";
    }

    return NextResponse.json(
      {
        message: "Exited impersonation mode successfully.",
        redirectUrl,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("Failed to exit impersonation:", error);
    return NextResponse.json(
      {
        message: "Failed to exit impersonation. Please try again.",
      },
      { status: 500 }
    );
  }
}

