import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { sanitizeInput } from "@/lib/sanitize";
import { requireAdminOrSuperAdmin } from "@/lib/auth-library";

const updateStaffSchema = z.object({
  firstName: z
    .string()
    .min(1, "First name is required")
    .min(2, "First name must be at least 2 characters")
    .max(75, "First name must not exceed 75 characters")
    .regex(/^[a-zA-Z\s'-]+$/, "First name can only contain letters, spaces, hyphens, and apostrophes"),
  lastName: z
    .string()
    .min(1, "Last name is required")
    .min(2, "Last name must be at least 2 characters")
    .max(75, "Last name must not exceed 75 characters")
    .regex(/^[a-zA-Z\s'-]+$/, "Last name can only contain letters, spaces, hyphens, and apostrophes"),
  email: z.string().email("Invalid email address"),
  contactNumber: z.string().max(50).optional().nullable(),
  staffCategory: z.enum(["Intern", "Working_Student", "Regular_Employee"]).optional().nullable(),
  assignedRole: z.string().max(100).optional().nullable(),
  status: z.enum(["Active", "Inactive", "Suspended"]).optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    await requireAdminOrSuperAdmin();
  } catch {
    return NextResponse.json(
      {
        message: "Unauthorized. Only Admin or Super Admin can update staff.",
      },
      { status: 403 }
    );
  }

  const resolvedParams = await Promise.resolve(params);
  const staffId = parseInt(resolvedParams.id);
  if (isNaN(staffId)) {
    return NextResponse.json(
      {
        message: "Invalid staff ID.",
      },
      { status: 400 }
    );
  }

  const body = await request.json().catch(() => null);
  const validation = updateStaffSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      {
        message: "Invalid staff data.",
        issues: validation.error.flatten(),
      },
      { status: 422 }
    );
  }

  const data = validation.data;

  try {
    // Check if staff exists and is actually a staff member
    const existingStaff = await prisma.lib_users.findUnique({
      where: { id: staffId },
      select: {
        user_role: true,
        status: true,
      },
    });

    if (!existingStaff) {
      return NextResponse.json(
        {
          message: "Staff member not found.",
        },
        { status: 404 }
      );
    }

    if (!["Admin", "Staff"].includes(existingStaff.user_role)) {
      return NextResponse.json(
        {
          message: "User is not a staff member.",
        },
        { status: 400 }
      );
    }

    // Check email uniqueness if email is being updated
    if (data.email) {
      const emailUser = await prisma.lib_users.findUnique({
        where: { email: sanitizeInput(data.email).toLowerCase() },
        select: { id: true },
      });

      if (emailUser && emailUser.id !== staffId) {
        return NextResponse.json(
          {
            message: "Email is already registered by another user.",
          },
          { status: 409 }
        );
      }
    }

    // Combine firstName and lastName into full_name
    const fullName = `${sanitizeInput(data.firstName)} ${sanitizeInput(data.lastName)}`.trim();

    // Prepare update data
    const updateData: any = {
      full_name: fullName,
      email: sanitizeInput(data.email).toLowerCase(),
    };

    if (data.contactNumber !== undefined) {
      updateData.contact_number = data.contactNumber ? sanitizeInput(data.contactNumber) : null;
    }
    if (data.status !== undefined) {
      updateData.status = data.status;
    }
    if (data.staffCategory !== undefined) {
      updateData.staff_category = data.staffCategory;
    }
    if (data.assignedRole !== undefined) {
      updateData.assigned_role = data.assignedRole ? sanitizeInput(data.assignedRole) : null;
    }

    // Get current status before update to check if we need to invalidate sessions
    const currentStatus = existingStaff.status;

    await prisma.lib_users.update({
      where: { id: staffId },
      data: updateData,
    });

    // If status is being changed to Inactive or Suspended, invalidate all sessions
    if (data.status && data.status !== "Active" && currentStatus === "Active") {
      await prisma.lib_sessions.deleteMany({
        where: { user_id: staffId },
      });
    }

    return NextResponse.json(
      {
        message: "Staff member updated successfully.",
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("Failed to update staff:", error);
    return NextResponse.json(
      {
        message: "Failed to update staff member. Please try again.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    await requireAdminOrSuperAdmin();
  } catch {
    return NextResponse.json(
      {
        message: "Unauthorized. Only Admin or Super Admin can delete staff.",
      },
      { status: 403 }
    );
  }

  const resolvedParams = await Promise.resolve(params);
  const staffId = parseInt(resolvedParams.id);
  if (isNaN(staffId)) {
    return NextResponse.json(
      {
        message: "Invalid staff ID.",
      },
      { status: 400 }
    );
  }

  try {
    // Check if staff exists and is actually a staff member
    const existingStaff = await prisma.lib_users.findUnique({
      where: { id: staffId },
      select: {
        user_role: true,
        full_name: true,
      },
    });

    if (!existingStaff) {
      return NextResponse.json(
        {
          message: "Staff member not found.",
        },
        { status: 404 }
      );
    }

    if (!["Admin", "Staff"].includes(existingStaff.user_role)) {
      return NextResponse.json(
        {
          message: "User is not a staff member.",
        },
        { status: 400 }
      );
    }

    // Delete all sessions for this user
    await prisma.lib_sessions.deleteMany({
      where: { user_id: staffId },
    });

    // Delete the staff member
    await prisma.lib_users.delete({
      where: { id: staffId },
    });

    return NextResponse.json(
      {
        message: "Staff member deleted successfully.",
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("Failed to delete staff:", error);
    return NextResponse.json(
      {
        message: "Failed to delete staff member. Please try again.",
      },
      { status: 500 }
    );
  }
}

