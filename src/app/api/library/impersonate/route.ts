import { NextResponse } from "next/server";
import { z } from "zod";

import { createSession, setSessionCookie, requireSuperAdmin, getCurrentSession } from "@/lib/auth-library";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

const impersonateSchema = z.object({
  userId: z.number().int().positive(),
});

const ORIGINAL_SESSION_COOKIE_NAME = "original_admin_session";

export async function POST(request: Request) {
  // Verify current user is Super Admin
  let currentSession;
  try {
    currentSession = await requireSuperAdmin();
  } catch {
    return NextResponse.json(
      {
        message: "Unauthorized. Only Super Admin can impersonate users.",
      },
      { status: 403 }
    );
  }

  const body = await request.json().catch(() => null);
  const validation = impersonateSchema.safeParse(body);
  
  if (!validation.success) {
    return NextResponse.json(
      {
        message: "Invalid request data.",
        issues: validation.error.flatten(),
      },
      { status: 422 }
    );
  }

  const { userId } = validation.data;

  // Prevent impersonating yourself
  if (userId === currentSession.user.id) {
    return NextResponse.json(
      {
        message: "You cannot impersonate yourself.",
      },
      { status: 400 }
    );
  }

  try {
    // Verify target user exists
    const targetUser = await prisma.lib_users.findUnique({
      where: { id: userId },
      select: {
        id: true,
        full_name: true,
        email: true,
        user_role: true,
        contact_number: true,
        profile_image: true,
        status: true,
      },
    });

    if (!targetUser) {
      return NextResponse.json(
        {
          message: "User not found.",
        },
        { status: 404 }
      );
    }

    // Store original session token for later restoration
    const cookieStore = await cookies();
    cookieStore.set(ORIGINAL_SESSION_COOKIE_NAME, currentSession.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: currentSession.expiresAt,
      path: "/",
    });

    // Create new session for target user
    const { token, expiresAt } = await createSession(userId);
    await setSessionCookie(token, expiresAt);

    // Determine redirect URL based on user role
    let redirectUrl = "/";
    if (targetUser.user_role === "Super_Admin" || targetUser.user_role === "Admin") {
      redirectUrl = "/admin";
    } else if (targetUser.user_role === "Staff") {
      redirectUrl = "/dashboard/staff";
    } else if (targetUser.user_role === "Student") {
      redirectUrl = "/dashboard/student";
    }

    return NextResponse.json(
      {
        message: "Impersonation successful.",
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
    console.error("Failed to impersonate user:", error);
    return NextResponse.json(
      {
        message: "Failed to impersonate user. Please try again.",
      },
      { status: 500 }
    );
  }
}

