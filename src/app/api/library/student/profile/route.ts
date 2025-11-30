import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { sanitizeInput } from "@/lib/sanitize";
import { requireStudent } from "@/lib/auth-library";

const profileUpdateSchema = z.object({
  fullName: z
    .string()
    .min(2, "Full name must be at least 2 characters")
    .max(150, "Full name must not exceed 150 characters"),
  contactNumber: z.string().min(1, "Contact number is required").max(50),
  yearLevel: z.string().min(1, "Year level is required").max(50),
  section: z.string().min(1, "Section is required").max(50),
  department: z.string().min(1, "Department is required").max(100),
});

export async function PATCH(request: Request) {
  let session;
  try {
    session = await requireStudent();
  } catch {
    return NextResponse.json(
      {
        message: "Unauthorized. Only students can update their profile.",
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

  const { fullName, contactNumber, yearLevel, section, department } = validation.data;

  try {
    // Get existing assigned_role to preserve sex field
    const existingUser = await prisma.lib_users.findUnique({
      where: { id: session.user.id },
      select: { assigned_role: true },
    });

    let existingData = {};
    if (existingUser?.assigned_role) {
      try {
        existingData = JSON.parse(existingUser.assigned_role);
      } catch {
        // If parsing fails, start fresh
      }
    }

    // Store additional info in assigned_role field as JSON, preserving existing sex field
    const additionalInfo = JSON.stringify({
      ...existingData,
      section: sanitizeInput(section),
      department: sanitizeInput(department),
    });

    await prisma.lib_users.update({
      where: { id: session.user.id },
      data: {
        full_name: sanitizeInput(fullName),
        contact_number: sanitizeInput(contactNumber),
        year_level: sanitizeInput(yearLevel),
        assigned_role: additionalInfo,
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

