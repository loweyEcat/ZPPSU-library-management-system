"use server";

import { prisma } from "@/lib/prisma";
import { requireAdminOrSuperAdmin, requireSuperAdmin } from "@/lib/auth-library";
import { cookies } from "next/headers";

export async function getAdminStaffMembers() {
  await requireAdminOrSuperAdmin();

  const staff = await prisma.lib_users.findMany({
    where: {
      user_role: {
        in: ["Admin", "Staff"],
      },
    },
    select: {
      id: true,
      full_name: true,
      email: true,
      contact_number: true,
      profile_image: true,
      staff_category: true,
      assigned_role: true,
      status: true,
      user_role: true,
    },
    orderBy: {
      date_registered: "desc",
    },
  });

  return staff;
}

export async function getStudents() {
  await requireAdminOrSuperAdmin();

  const students = await prisma.lib_users.findMany({
    where: {
      user_role: "Student",
    },
    select: {
      id: true,
      full_name: true,
      student_id: true,
      profile_image: true,
      year_level: true,
      assigned_role: true,
      status: true,
      date_registered: true,
    },
    orderBy: {
      date_registered: "desc",
    },
  });

  // Parse assigned_role to extract section and department
  return students.map((student) => {
    let section: string | null = null;
    let department: string | null = null;
    
    if (student.assigned_role) {
      try {
        const additionalInfo = JSON.parse(student.assigned_role);
        section = additionalInfo.section || null;
        department = additionalInfo.department || null;
      } catch {
        // If parsing fails, leave as null
      }
    }

    return {
      ...student,
      section,
      department,
      date_registered: student.date_registered.toISOString(),
    };
  });
}

export async function getUserById(userId: number) {
  await requireSuperAdmin();

  const user = await prisma.lib_users.findUnique({
    where: { id: userId },
    select: {
      id: true,
      full_name: true,
      email: true,
      contact_number: true,
      profile_image: true,
      staff_category: true,
      assigned_role: true,
      year_level: true,
      student_id: true,
      status: true,
      user_role: true,
    },
  });

  if (!user) {
    return null;
  }

  // Parse assigned_role for students
  let section: string | null = null;
  let department: string | null = null;
  if (user.assigned_role && user.user_role === "Student") {
    try {
      const additionalInfo = JSON.parse(user.assigned_role);
      section = additionalInfo.section || null;
      department = additionalInfo.department || null;
    } catch {
      // If parsing fails, leave as null
    }
  }

  return {
    ...user,
    section,
    department,
  };
}

export async function checkImpersonationStatus() {
  const cookieStore = await cookies();
  const originalToken = cookieStore.get("original_admin_session")?.value;
  
  if (!originalToken) {
    return { isImpersonating: false };
  }

  try {
    // Verify the original session belongs to a Super Admin
    const { hashToken } = await import("@/lib/tokens");
    const tokenHash = hashToken(originalToken);
    
    const originalSession = await prisma.lib_sessions.findUnique({
      where: { token_hash: tokenHash },
      include: {
        user: {
          select: {
            user_role: true,
          },
        },
      },
    });

    // Only show exit button if original session exists and belongs to Super Admin
    const isImpersonating = !!(
      originalSession &&
      originalSession.user.user_role === "Super_Admin" &&
      originalSession.expires_at > new Date()
    );

    return { isImpersonating };
  } catch (error) {
    console.error("Error checking impersonation status:", error);
    return { isImpersonating: false };
  }
}
