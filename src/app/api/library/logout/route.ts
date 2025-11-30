import { NextResponse } from "next/server";

import { getCurrentSession, clearSessionCookie } from "@/lib/auth-library";
import { hashToken } from "@/lib/tokens";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const session = await getCurrentSession();

  if (session) {
    const tokenHash = hashToken(session.token);
    await prisma.lib_sessions.deleteMany({
      where: { token_hash: tokenHash },
    });
  }

  await clearSessionCookie();

  return NextResponse.json(
    {
      message: "Logged out successfully.",
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}

