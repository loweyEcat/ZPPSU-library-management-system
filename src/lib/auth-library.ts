import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { generateRandomToken, hashToken } from "@/lib/tokens";

const SESSION_COOKIE_NAME = "library_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 14; // 14 days

export type AuthenticatedUser = {
  id: number;
  fullName: string;
  email: string;
  userRole: "Super_Admin" | "Admin" | "Staff" | "Student";
  contactNumber: string | null;
  profileImage: string | null;
  status: "Active" | "Inactive" | "Suspended";
};

type SessionPayload = {
  id: number;
  token: string;
  expiresAt: Date;
  user: AuthenticatedUser;
};

export const mapUser = (user: {
  id: number;
  full_name: string;
  email: string;
  user_role: "Super_Admin" | "Admin" | "Staff" | "Student";
  contact_number: string | null;
  profile_image: string | null;
  status: "Active" | "Inactive" | "Suspended";
}): AuthenticatedUser => {
  return {
    id: user.id,
    fullName: user.full_name,
    email: user.email,
    userRole: user.user_role,
    contactNumber: user.contact_number,
    profileImage: user.profile_image,
    status: user.status,
  };
};

export async function createSession(userId: number): Promise<{
  token: string;
  expiresAt: Date;
}> {
  const token = generateRandomToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000);

  await prisma.lib_sessions.create({
    data: {
      token_hash: tokenHash,
      user_id: userId,
      expires_at: expiresAt,
    },
  });

  return { token, expiresAt };
}

export async function setSessionCookie(token: string, expiresAt: Date) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export const getCurrentSession = cache(
  async (): Promise<SessionPayload | null> => {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!sessionToken) {
      return null;
    }

    const tokenHash = hashToken(sessionToken);
    const now = new Date();

    const session = await prisma.lib_sessions.findUnique({
      where: { token_hash: tokenHash },
      include: {
        user: true,
      },
    });

    if (!session || session.expires_at <= now) {
      if (session) {
        await prisma.lib_sessions.delete({
          where: { token_hash: tokenHash },
        });
      }
      return null;
    }

    // Check if user is in impersonation mode (Super Admin impersonating)
    const originalAdminSession = cookieStore.get("original_admin_session")?.value;
    const isImpersonating = !!originalAdminSession;

    // If not impersonating, check if user status is Active
    // If impersonating, allow access even if user is deactivated
    if (!isImpersonating && session.user.status !== "Active") {
      // User account is deactivated, invalidate session and log them out
      await prisma.lib_sessions.delete({
        where: { token_hash: tokenHash },
      });
      await clearSessionCookie();
      return null;
    }

    const user = mapUser(session.user);

    return {
      id: session.id,
      token: sessionToken,
      expiresAt: session.expires_at,
      user,
    };
  }
);

export async function requireAuth(): Promise<SessionPayload> {
  const session = await getCurrentSession();
  if (!session) {
    redirect("/login");
  }
  return session;
}

export async function requireSuperAdmin(): Promise<SessionPayload> {
  const session = await requireAuth();
  if (session.user.userRole !== "Super_Admin") {
    redirect("/");
  }
  return session;
}

export async function requireAdminOrSuperAdmin(): Promise<SessionPayload> {
  const session = await requireAuth();
  if (
    session.user.userRole !== "Super_Admin" &&
    session.user.userRole !== "Admin"
  ) {
    redirect("/");
  }
  return session;
}

export async function requireStaffOrAbove(): Promise<SessionPayload> {
  const session = await requireAuth();
  if (
    session.user.userRole !== "Super_Admin" &&
    session.user.userRole !== "Admin" &&
    session.user.userRole !== "Staff"
  ) {
    redirect("/");
  }
  return session;
}

export async function requireStudent(): Promise<SessionPayload> {
  const session = await requireAuth();
  if (session.user.userRole !== "Student") {
    redirect("/");
  }
  return session;
}