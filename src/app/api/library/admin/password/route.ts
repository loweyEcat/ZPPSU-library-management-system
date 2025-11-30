import { NextResponse } from "next/server";
import { z } from "zod";

import { hashPassword, verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { requireAdminOrSuperAdmin } from "@/lib/auth-library";

const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(100, "Password must not exceed 100 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain at least one uppercase letter, one lowercase letter, and one number"
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export async function PATCH(request: Request) {
  let session;
  try {
    session = await requireAdminOrSuperAdmin();
  } catch {
    return NextResponse.json(
      {
        message: "Unauthorized. Only admin users can change their password.",
      },
      { status: 403 }
    );
  }
  const body = await request.json().catch(() => null);

  const validation = passwordChangeSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      {
        message: "Invalid password data.",
        issues: validation.error.flatten(),
      },
      { status: 422 }
    );
  }

  const { currentPassword, newPassword } = validation.data;

  try {
    // Get current user with password
    const user = await prisma.lib_users.findUnique({
      where: { id: session.user.id },
      select: { password: true },
    });

    if (!user) {
      return NextResponse.json(
        {
          message: "User not found.",
        },
        { status: 404 }
      );
    }

    // Verify current password
    const passwordMatches = await verifyPassword(currentPassword, user.password);
    if (!passwordMatches) {
      return NextResponse.json(
        {
          message: "Current password is incorrect.",
        },
        { status: 401 }
      );
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password
    await prisma.lib_users.update({
      where: { id: session.user.id },
      data: { password: hashedPassword },
    });

    return NextResponse.json(
      {
        message: "Password changed successfully.",
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("Failed to change password:", error);
    return NextResponse.json(
      {
        message: "Failed to change password. Please try again.",
      },
      { status: 500 }
    );
  }
}

