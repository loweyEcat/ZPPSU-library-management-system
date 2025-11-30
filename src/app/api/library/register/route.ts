import { NextResponse } from "next/server";
import { z } from "zod";

import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { sanitizeInput } from "@/lib/sanitize";

const superAdminRegistrationSchema = z.object({
  fullName: z
    .string()
    .min(2, "Full name must be at least 2 characters")
    .max(150, "Full name must not exceed 150 characters"),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password must not exceed 100 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    ),
  confirmPassword: z.string(),
  contactNumber: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export async function POST(request: Request) {
  // Check if super admin already exists
  const existingSuperAdmin = await prisma.lib_users.findFirst({
    where: { user_role: "Super_Admin" },
    select: { id: true },
  });

  if (existingSuperAdmin) {
    return NextResponse.json(
      {
        message: "Super Admin account already exists. Please login instead.",
      },
      { status: 403 }
    );
  }

  const body = await request.json().catch(() => null);

  const validation = superAdminRegistrationSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      {
        message: "Invalid registration data.",
        issues: validation.error.flatten(),
      },
      { status: 422 }
    );
  }

  const { fullName, email, password, contactNumber } = validation.data;

  // Check if email already exists
  const existingUser = await prisma.lib_users.findUnique({
    where: { email: sanitizeInput(email).toLowerCase() },
    select: { id: true },
  });

  if (existingUser) {
    return NextResponse.json(
      {
        message: "Email is already registered.",
      },
      { status: 409 }
    );
  }

  try {
    const hashedPassword = await hashPassword(password);

    const newUser = await prisma.lib_users.create({
      data: {
        full_name: sanitizeInput(fullName),
        email: sanitizeInput(email).toLowerCase(),
        password: hashedPassword,
        contact_number: contactNumber ? sanitizeInput(contactNumber) : null,
        user_role: "Super_Admin",
        status: "Active",
      },
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

    return NextResponse.json(
      {
        message: "Super Admin account created successfully. You can now login.",
        user: {
          id: newUser.id,
          fullName: newUser.full_name,
          email: newUser.email,
          userRole: newUser.user_role,
        },
      },
      {
        status: 201,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("Failed to create super admin:", error);
    return NextResponse.json(
      {
        message: "Failed to create account. Please try again.",
      },
      { status: 500 }
    );
  }
}

