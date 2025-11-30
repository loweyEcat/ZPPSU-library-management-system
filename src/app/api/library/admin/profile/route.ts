import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { sanitizeInput } from "@/lib/sanitize";
import { requireAdminOrSuperAdmin } from "@/lib/auth-library";

const profileUpdateSchema = z.object({
  fullName: z
    .string()
    .min(2, "Full name must be at least 2 characters")
    .max(150, "Full name must not exceed 150 characters"),
  email: z.string().email("Invalid email address"),
  contactNumber: z.string().min(1, "Contact number is required").max(50),
});

export async function PATCH(request: Request) {
  let session;
  try {
    session = await requireAdminOrSuperAdmin();
  } catch {
    return NextResponse.json(
      {
        message: "Unauthorized. Only admin users can update their profile.",
      },
      { status: 403 }
    );
  }
  const body = await request.json().catch(() => null);

  const validation = profileUpdateSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      {
        message: "Invalid profile data.",
        issues: validation.error.flatten(),
      },
      { status: 422 }
    );
  }

  const { fullName, email, contactNumber } = validation.data;

  try {
    // Check if email is already taken by another user
    const existingUser = await prisma.lib_users.findUnique({
      where: { email: sanitizeInput(email).toLowerCase() },
      select: { id: true },
    });

    if (existingUser && existingUser.id !== session.user.id) {
      return NextResponse.json(
        {
          message: "Email is already registered by another user.",
        },
        { status: 409 }
      );
    }

    await prisma.lib_users.update({
      where: { id: session.user.id },
      data: {
        full_name: sanitizeInput(fullName),
        email: sanitizeInput(email).toLowerCase(),
        contact_number: sanitizeInput(contactNumber),
      },
    });

    return NextResponse.json(
      {
        message: "Profile updated successfully.",
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("Failed to update profile:", error);
    return NextResponse.json(
      {
        message: "Failed to update profile. Please try again.",
      },
      { status: 500 }
    );
  }
}

