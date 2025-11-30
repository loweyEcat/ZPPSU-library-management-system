import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { sanitizeInput } from "@/lib/sanitize";
import { requireSuperAdmin } from "@/lib/auth-library";

const updateUserSchema = z.object({
  fullName: z
    .string()
    .min(2, "Full name must be at least 2 characters")
    .max(150, "Full name must not exceed 150 characters")
    .optional(),
  email: z.string().email("Invalid email address").optional(),
  contactNumber: z.string().max(50).optional().nullable(),
  staffCategory: z.enum(["Intern", "Working_Student", "Regular_Employee"]).optional().nullable(),
  assignedRole: z.string().max(100).optional().nullable(),
  yearLevel: z.string().max(50).optional().nullable(),
  section: z.string().max(50).optional().nullable(),
  department: z.string().max(100).optional().nullable(),
  status: z.enum(["Active", "Inactive", "Suspended"]).optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    await requireSuperAdmin();
  } catch {
    return NextResponse.json(
      {
        message: "Unauthorized. Only Super Admin can update users.",
      },
      { status: 403 }
    );
  }

  const resolvedParams = await Promise.resolve(params);
  const userId = parseInt(resolvedParams.id);
  if (isNaN(userId)) {
    return NextResponse.json(
      {
        message: "Invalid user ID.",
      },
      { status: 400 }
    );
  }

  const body = await request.json().catch(() => null);
  const validation = updateUserSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      {
        message: "Invalid user data.",
        issues: validation.error.flatten(),
      },
      { status: 422 }
    );
  }

  const data = validation.data;

  try {
    // Check if user exists
    const existingUser = await prisma.lib_users.findUnique({
      where: { id: userId },
      select: {
        user_role: true,
        assigned_role: true,
      },
    });

    if (!existingUser) {
      return NextResponse.json(
        {
          message: "User not found.",
        },
        { status: 404 }
      );
    }

    // Check email uniqueness if email is being updated
    if (data.email) {
      const emailUser = await prisma.lib_users.findUnique({
        where: { email: sanitizeInput(data.email).toLowerCase() },
        select: { id: true },
      });

      if (emailUser && emailUser.id !== userId) {
        return NextResponse.json(
          {
            message: "Email is already registered by another user.",
          },
          { status: 409 }
        );
      }
    }

    // Prepare update data
    const updateData: any = {};

    if (data.fullName) updateData.full_name = sanitizeInput(data.fullName);
    if (data.email) updateData.email = sanitizeInput(data.email).toLowerCase();
    if (data.contactNumber !== undefined) {
      updateData.contact_number = data.contactNumber ? sanitizeInput(data.contactNumber) : null;
    }
    if (data.status) updateData.status = data.status;
    if (data.staffCategory !== undefined) {
      updateData.staff_category = data.staffCategory;
    }
    if (data.assignedRole !== undefined) {
      updateData.assigned_role = data.assignedRole ? sanitizeInput(data.assignedRole) : null;
    }
    if (data.yearLevel !== undefined) {
      updateData.year_level = data.yearLevel ? sanitizeInput(data.yearLevel) : null;
    }

    // Handle section and department for students (stored in assigned_role as JSON)
    if (data.section !== undefined || data.department !== undefined) {
      let existingData = {};
      if (existingUser.assigned_role) {
        try {
          existingData = JSON.parse(existingUser.assigned_role);
        } catch {
          // If parsing fails, start fresh
        }
      }

      const additionalInfo = JSON.stringify({
        ...existingData,
        ...(data.section !== undefined && { section: data.section ? sanitizeInput(data.section) : null }),
        ...(data.department !== undefined && { department: data.department ? sanitizeInput(data.department) : null }),
      });

      updateData.assigned_role = additionalInfo;
    }

    // Get current status before update to check if we need to invalidate sessions
    const currentUser = await prisma.lib_users.findUnique({
      where: { id: userId },
      select: { status: true },
    });

    await prisma.lib_users.update({
      where: { id: userId },
      data: updateData,
    });

    // If status is being changed to Inactive or Suspended, invalidate all sessions
    if (data.status && data.status !== "Active" && currentUser?.status === "Active") {
      await prisma.lib_sessions.deleteMany({
        where: { user_id: userId },
      });
    }

    return NextResponse.json(
      {
        message: "User updated successfully.",
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("Failed to update user:", error);
    return NextResponse.json(
      {
        message: "Failed to update user. Please try again.",
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    await requireSuperAdmin();
  } catch {
    return NextResponse.json(
      {
        message: "Unauthorized. Only Super Admin can perform this action.",
      },
      { status: 403 }
    );
  }

  const resolvedParams = await Promise.resolve(params);
  const userId = parseInt(resolvedParams.id);
  if (isNaN(userId)) {
    return NextResponse.json(
      {
        message: "Invalid user ID.",
      },
      { status: 400 }
    );
  }

  const body = await request.json().catch(() => null);
  const action = body?.action;

  if (action === "reset") {
    // Reset user information
    try {
      const user = await prisma.lib_users.findUnique({
        where: { id: userId },
        select: { user_role: true },
      });

      if (!user) {
        return NextResponse.json(
          {
            message: "User not found.",
          },
          { status: 404 }
        );
      }

      // Reset based on user role
      const resetData: any = {
        contact_number: null,
        profile_image: null,
      };

      if (user.user_role === "Staff" || user.user_role === "Admin") {
        resetData.staff_category = null;
        resetData.assigned_role = null;
      } else if (user.user_role === "Student") {
        resetData.year_level = null;
        resetData.assigned_role = null;
      }

      await prisma.lib_users.update({
        where: { id: userId },
        data: resetData,
      });

      return NextResponse.json(
        {
          message: "User information reset successfully.",
        },
        {
          status: 200,
          headers: {
            "Cache-Control": "no-store",
          },
        }
      );
    } catch (error) {
      console.error("Failed to reset user:", error);
      return NextResponse.json(
        {
          message: "Failed to reset user. Please try again.",
        },
        { status: 500 }
      );
    }
  } else if (action === "toggle-status") {
    // Toggle user status (activate/deactivate)
    try {
      const user = await prisma.lib_users.findUnique({
        where: { id: userId },
        select: { status: true },
      });

      if (!user) {
        return NextResponse.json(
          {
            message: "User not found.",
          },
          { status: 404 }
        );
      }

      const newStatus = user.status === "Active" ? "Inactive" : "Active";

      // Update user status
      await prisma.lib_users.update({
        where: { id: userId },
        data: { status: newStatus },
      });

      // If deactivating, invalidate all active sessions for this user
      // This will force them to log out on their next request
      if (newStatus !== "Active") {
        await prisma.lib_sessions.deleteMany({
          where: { user_id: userId },
        });
      }

      return NextResponse.json(
        {
          message: `User ${newStatus === "Active" ? "activated" : "deactivated"} successfully.`,
          status: newStatus,
        },
        {
          status: 200,
          headers: {
            "Cache-Control": "no-store",
          },
        }
      );
    } catch (error) {
      console.error("Failed to toggle user status:", error);
      return NextResponse.json(
        {
          message: "Failed to toggle user status. Please try again.",
        },
        { status: 500 }
      );
    }
  }

  return NextResponse.json(
    {
      message: "Invalid action.",
    },
    { status: 400 }
  );
}

