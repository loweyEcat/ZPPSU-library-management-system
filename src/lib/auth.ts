import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { PERMISSIONS, type PermissionKey, isPermissionKey } from "@/lib/permissions";
import { generateRandomToken, hashToken } from "@/lib/tokens";

const SESSION_COOKIE_NAME = "tfoe_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 14; // 14 days

export type AuthenticatedRole = {
  id: string;
  name: string;
  description: string | null;
  isSystemDefault: boolean;
};

export type AuthenticatedPermission = {
  id: string;
  key: PermissionKey;
  description: string | null;
};

export type AuthenticatedUser = {
  id: string;
  role:
    | "eagle_member"
    | "eagle_club_president"
    | "eagle_regional_governor"
    | "admin"
    | "super_admin";
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  regionName: string;
  clubName: string | null;
  nationalScope: "national" | "international" | null;
  roles: AuthenticatedRole[];
  permissions: AuthenticatedPermission[];
};

type SessionPayload = {
  id: string;
  token: string;
  expiresAt: Date;
  user: AuthenticatedUser;
};

const mapUser = (user: {
  id: string;
  role: AuthenticatedUser["role"];
  first_name: string;
  last_name: string;
  email: string;
  username: string;
  region_name: string;
  club_name: string | null;
  national_scope: "national" | "international" | null;
  user_role_memberships: Array<{
    role: {
      id: string;
      name: string;
      description: string | null;
      is_system_default: boolean;
      role_permissions: Array<{
        permission: {
          id: string;
          key: string;
          description: string | null;
        } | null;
      }>;
    } | null;
  }>;
}): AuthenticatedUser => {
  const roles: AuthenticatedRole[] = [];
  const permissionMap = new Map<PermissionKey, AuthenticatedPermission>();

  for (const membership of user.user_role_memberships ?? []) {
    if (!membership?.role) {
      continue;
    }
    roles.push({
      id: membership.role.id,
      name: membership.role.name,
      description: membership.role.description,
      isSystemDefault: membership.role.is_system_default,
    });

    for (const rolePermission of membership.role.role_permissions ?? []) {
      const permission = rolePermission.permission;
      if (!permission || !isPermissionKey(permission.key)) {
        continue;
      }
      if (!permissionMap.has(permission.key)) {
        permissionMap.set(permission.key, {
          id: permission.id,
          key: permission.key,
          description: permission.description,
        });
      }
    }
  }

  return {
    id: user.id,
    role: user.role,
    firstName: user.first_name,
    lastName: user.last_name,
    email: user.email,
    username: user.username,
    regionName: user.region_name,
    clubName: user.club_name,
    nationalScope: user.national_scope,
    roles,
    permissions: Array.from(permissionMap.values()),
  };
};

export const mapAuthenticatedUser = mapUser;

export async function createSession(userId: string) {
  const token = generateRandomToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000);

  await prisma.tfoe_sessions.create({
    data: {
      token_hash: tokenHash,
      user_id: userId,
      expires_at: expiresAt,
    },
  });

  return { token, expiresAt };
}

export async function setSessionCookie(token: string, expiresAt: Date) {
  const cookieJar = await cookies();
  cookieJar.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    expires: expiresAt,
  });
}

export async function clearSessionCookie() {
  const cookieJar = await cookies();
  cookieJar.delete(SESSION_COOKIE_NAME);
}

export async function destroySession(token: string) {
  const tokenHash = hashToken(token);
  await prisma.tfoe_sessions.deleteMany({
    where: { token_hash: tokenHash },
  });
}

const safeGetCookie = async () => {
  try {
    const store = await cookies();
    if (typeof store?.get === "function") {
      return store.get(SESSION_COOKIE_NAME) ?? null;
    }
    if (typeof store?.getAll === "function") {
      const match = store.getAll().find((cookie) => cookie.name === SESSION_COOKIE_NAME);
      return match ?? null;
    }
    if (Array.isArray(store)) {
      return store.find((cookie) => cookie?.name === SESSION_COOKIE_NAME) ?? null;
    }
  } catch {
    // noop – treat as missing cookie
  }
  return null;
};

export const getCurrentSession = cache(async (): Promise<SessionPayload | null> => {
  const sessionCookie = await safeGetCookie();
  if (!sessionCookie) {
    return null;
  }

  const token = sessionCookie.value;
  if (!token) {
    return null;
  }

  const tokenHash = hashToken(token);
  const session = await prisma.tfoe_sessions.findUnique({
    where: { token_hash: tokenHash },
    select: {
      id: true,
      expires_at: true,
      user: {
        select: {
          id: true,
          role: true,
          first_name: true,
          last_name: true,
          email: true,
          username: true,
          region_name: true,
          club_name: true,
          national_scope: true,
          user_role_memberships: {
            select: {
              role: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                  is_system_default: true,
                  role_permissions: {
                    select: {
                      permission: {
                        select: {
                          id: true,
                          key: true,
                          description: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!session || session.expires_at.getTime() < Date.now()) {
    if (session) {
      await prisma.tfoe_sessions.delete({
        where: { id: session.id },
      });
    }
    await clearSessionCookie();
    return null;
  }

  return {
    id: session.id,
    token,
    expiresAt: session.expires_at,
    user: mapUser(session.user),
  };
});

export async function requireCurrentUser() {
  const session = await getCurrentSession();
  if (!session) {
    redirect("/login");
  }
  return session;
}

export async function requireGovernorUser() {
  const session = await requireCurrentUser();
  const isGovernor =
    session.user.role === "eagle_regional_governor" ||
    userHasPermission(session.user, PERMISSIONS.ReviewGovernorApplications) ||
    userHasPermission(session.user, PERMISSIONS.ManageGovernorApplications);
  if (!isGovernor) {
    redirect("/");
  }
  return session;
}

export async function requireClubPresidentUser() {
  const session = await requireCurrentUser();
  const isClubPresident =
    session.user.role === "eagle_club_president" ||
    userHasPermission(session.user, PERMISSIONS.ManageInvites);
  if (!isClubPresident) {
    redirect("/");
  }
  return session;
}

export const userHasPermission = (user: AuthenticatedUser, permission: PermissionKey) =>
  user.permissions.some((entry) => entry.key === permission);

export const userHasRole = (user: AuthenticatedUser, roleName: string) =>
  user.role === roleName || user.roles.some((role) => role.name === roleName);

export async function requirePermission(permission: PermissionKey) {
  const session = await requireCurrentUser();
  if (!userHasPermission(session.user, permission)) {
    redirect("/login");
  }
  return session;
}

