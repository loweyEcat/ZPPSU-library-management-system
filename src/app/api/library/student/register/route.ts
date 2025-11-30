import { NextResponse } from "next/server";
import { z } from "zod";

import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { sanitizeInput } from "@/lib/sanitize";

const studentRegistrationSchema = z
  .object({
    firstName: z
      .string()
      .min(1, "First name is required")
      .max(75, "First name must not exceed 75 characters"),
    lastName: z
      .string()
      .min(1, "Last name is required")
      .max(75, "Last name must not exceed 75 characters"),
    fullName: z.string().min(2).max(150),
    email: z.string().email("Invalid email address"),
    contactNumber: z.string().min(1, "Contact number is required"),
    sex: z.enum(["Male", "Female", "Other"]),
    studentId: z.string().min(1, "Student ID is required").max(50),
    section: z.string().min(1, "Section is required").max(50),
    department: z.string().min(1, "Department is required").max(100),
    yearLevel: z.string().min(1, "Year level is required").max(50),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(100, "Password must not exceed 100 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain at least one uppercase letter, one lowercase letter, and one number"
      ),
    confirmPassword: z.string(),
    uploadedSchoolId: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  const validation = studentRegistrationSchema.safeParse(body);
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
    fullName,
    email,
    password,
    contactNumber,
    studentId,
    section,
    department,
    yearLevel,
    uploadedSchoolId,
  } = validation.data;

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

  // Check if student ID already exists
  const existingStudentId = await prisma.lib_users.findFirst({
    where: { student_id: sanitizeInput(studentId) },
    select: { id: true },
  });

  if (existingStudentId) {
    return NextResponse.json(
      {
        message: "Student ID is already registered.",
      },
      { status: 409 }
    );
  }

  try {
    const hashedPassword = await hashPassword(password);

    // Store additional info in assigned_role field as JSON (since schema doesn't have separate fields)
    const additionalInfo = JSON.stringify({
      sex: validation.data.sex,
      section: sanitizeInput(section),
      department: sanitizeInput(department),
    });

    const newUser = await prisma.lib_users.create({
      data: {
        full_name: sanitizeInput(fullName),
        email: sanitizeInput(email).toLowerCase(),
        password: hashedPassword,
        contact_number: sanitizeInput(contactNumber),
        user_role: "Student",
        student_id: sanitizeInput(studentId),
        year_level: sanitizeInput(yearLevel),
        assigned_role: additionalInfo,
        uploaded_school_id: uploadedSchoolId || null,
        status: "Active",
      },
      select: {
        id: true,
        full_name: true,
        email: true,
        user_role: true,
        contact_number: true,
        student_id: true,
        year_level: true,
        status: true,
      },
    });

    return NextResponse.json(
      {
        message: "Student account created successfully. You can now login.",
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
    console.error("Failed to create student:", error);
    return NextResponse.json(
      {
        message: "Failed to create account. Please try again.",
      },
      { status: 500 }
    );
  }
}

