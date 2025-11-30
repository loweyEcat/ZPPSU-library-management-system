"use server";

import { prisma } from "@/lib/prisma";
import { requireAdminOrSuperAdmin } from "@/lib/auth-library";

export async function getStaffMembers() {
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
      date_registered: true,
    },
    orderBy: {
      date_registered: "desc",
    },
  });

  // Serialize dates to strings for client components
  return staff.map((member) => ({
    ...member,
    date_registered: member.date_registered.toISOString(),
  }));
}

export async function getStaffById(staffId: number) {
  await requireAdminOrSuperAdmin();

  const staff = await prisma.lib_users.findUnique({
    where: {
      id: staffId,
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
  });

  if (!staff) {
    return null;
  }

  // Split full_name into firstName and lastName
  const nameParts = staff.full_name.trim().split(/\s+/);
  const firstName = nameParts[0] || "";
  const lastName = nameParts.slice(1).join(" ") || "";

  return {
    ...staff,
    firstName,
    lastName,
  };
}

