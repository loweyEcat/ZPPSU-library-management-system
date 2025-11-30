import { NextResponse } from "next/server";
import { z } from "zod";

import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { sanitizeInput } from "@/lib/sanitize";
import { requireAdminOrSuperAdmin } from "@/lib/auth-library";

const staffRegistrationSchema = z
  .object({
    firstName: z
      .string()
      .min(1, "First name is required")
      .min(2, "First name must be at least 2 characters")
      .max(75, "First name must not exceed 75 characters")
      .regex(
        /^[a-zA-Z\s'-]+$/,
        "First name can only contain letters, spaces, hyphens, and apostrophes"
      ),
    lastName: z
      .string()
      .min(1, "Last name is required")
      .min(2, "Last name must be at least 2 characters")
      .max(75, "Last name must not exceed 75 characters")
      .regex(
        /^[a-zA-Z\s'-]+$/,
        "Last name can only contain letters, spaces, hyphens, and apostrophes"
      ),
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
    staffCategory: z
      .enum(["Intern", "Working_Student", "Regular_Employee"])
      .optional(),
    assignedRole: z
      .string()
      .max(100, "Assigned role must not exceed 100 characters")
      .optional(),
    studentId: z
      .string()
      .max(50, "Student ID must not exceed 50 characters")
      .optional(),
    section: z
      .string()
      .max(50, "Section must not exceed 50 characters")
      .optional(),
    department: z
      .string()
      .max(100, "Department must not exceed 100 characters")
      .optional(),
    yearLevel: z
      .string()
      .max(50, "Year level must not exceed 50 characters")
      .optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  .refine(
    (data) => {
      // If staff category is Intern or Working_Student, student fields are required
      if (
        data.staffCategory === "Intern" ||
        data.staffCategory === "Working_Student"
      ) {
        return (
          data.studentId &&
          data.studentId.trim().length > 0 &&
          data.section &&
          data.section.trim().length > 0 &&
          data.department &&
          data.department.trim().length > 0 &&
          data.yearLevel &&
          data.yearLevel.trim().length > 0
        );
      }
      return true;
    },
    {
      message:
        "Student ID, Section, Department, and Year Level are required for Intern and Working Student",
      path: ["studentId"],
    }
  );

export async function POST(request: Request) {
  try {
    await requireAdminOrSuperAdmin();
  } catch {
    return NextResponse.json(
      {
        message:
          "Unauthorized. Only Admin or Super Admin can create staff accounts.",
      },
      { status: 403 }
    );
  }

  const body = await request.json().catch(() => null);

  const validation = staffRegistrationSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      {
        message: "Invalid registration data.",
        issues: validation.error.flatten(),
      },
      { status: 422 }
    );
  }

  const {
    firstName,
    lastName,
    email,
    password,
    contactNumber,
    staffCategory,
    assignedRole,
    studentId,
    section,
    department,
    yearLevel,
  } = validation.data;

  // Combine first and last name into full_name
  const fullName = `${sanitizeInput(firstName)} ${sanitizeInput(
    lastName
  )}`.trim();

  // For Intern and Working Student, store student info (section, department) in assigned_role as JSON
  // along with assignedRole if provided
  // Format: { section: "...", department: "...", assignedRole: "..." }
  // For Regular Employee, just store assignedRole as string
  let finalAssignedRole: string | null = null;
  if (staffCategory === "Intern" || staffCategory === "Working_Student") {
    const studentInfo: any = {};
    if (section) studentInfo.section = sanitizeInput(section);
    if (department) studentInfo.department = sanitizeInput(department);
    if (assignedRole) studentInfo.assignedRole = sanitizeInput(assignedRole);
    finalAssignedRole =
      Object.keys(studentInfo).length > 0 ? JSON.stringify(studentInfo) : null;
  } else {
    finalAssignedRole = assignedRole ? sanitizeInput(assignedRole) : null;
  }

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
        full_name: fullName,
        email: sanitizeInput(email).toLowerCase(),
        password: hashedPassword,
        contact_number: contactNumber ? sanitizeInput(contactNumber) : null,
        user_role: "Staff",
        staff_category: staffCategory || null,
        assigned_role: finalAssignedRole,
        student_id:
          (staffCategory === "Intern" || staffCategory === "Working_Student") &&
          studentId
            ? sanitizeInput(studentId)
            : null,
        year_level:
          (staffCategory === "Intern" || staffCategory === "Working_Student") &&
          yearLevel
            ? sanitizeInput(yearLevel)
            : null,
        status: "Active",
      },
      select: {
        id: true,
        full_name: true,
        email: true,
        user_role: true,
        contact_number: true,
        profile_image: true,
        staff_category: true,
        assigned_role: true,
        status: true,
      },
    });

    return NextResponse.json(
      {
        message: "Staff account created successfully.",
        user: {
          id: newUser.id,
          fullName: newUser.full_name,
          email: newUser.email,
          userRole: newUser.user_role,
          contactNumber: newUser.contact_number,
          profileImage: newUser.profile_image,
          staffCategory: newUser.staff_category,
          assignedRole: newUser.assigned_role,
          status: newUser.status,
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
    console.error("Failed to create staff:", error);
    return NextResponse.json(
      {
        message: "Failed to create account. Please try again.",
      },
      { status: 500 }
    );
  }
}
