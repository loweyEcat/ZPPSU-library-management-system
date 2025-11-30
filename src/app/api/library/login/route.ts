import { NextResponse } from "next/server";
import { z } from "zod";

import { mapUser, createSession, setSessionCookie } from "@/lib/auth-library";
import { verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { sanitizeInput } from "@/lib/sanitize";

const loginSchema = z.object({
  email: z.string().email("Invalid email address").min(1, "Email is required"),
  password: z.string().min(1, "Password is required").max(256),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  const validation = loginSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      {
        message: "Invalid login payload.",
        issues: validation.error.flatten(),
      },
      { status: 422 }
    );
  }

  const email = sanitizeInput(validation.data.email).toLowerCase();
  const password = validation.data.password;

  const user = await prisma.lib_users.findUnique({
    where: { email },
    select: {
      id: true,
      full_name: true,
      email: true,
      password: true,
      user_role: true,
      contact_number: true,
      profile_image: true,
      status: true,
    },
  });

  if (!user) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return NextResponse.json(
      {
        message: "Invalid credentials.",
      },
      { status: 401 }
    );
  }

  if (user.status !== "Active") {
    return NextResponse.json(
      {
        message: "Your account is not active. Please contact an administrator.",
      },
      { status: 403 }
    );
  }

  const passwordMatches = await verifyPassword(password, user.password);
  if (!passwordMatches) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return NextResponse.json(
      {
        message: "Invalid credentials.",
      },
      { status: 401 }
    );
  }

  const { token, expiresAt } = await createSession(user.id);
  await setSessionCookie(token, expiresAt);

  return NextResponse.json(
    {
      message: "Login successful.",
      user: mapUser(user),
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}

