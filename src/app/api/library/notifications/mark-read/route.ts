import { NextResponse } from "next/server";
import { requireStudent } from "@/lib/auth-library";
import { z } from "zod";

const markReadSchema = z.object({
  notificationIds: z.array(z.string()),
});

export async function POST(request: Request) {
  try {
    await requireStudent();
    const body = await request.json().catch(() => null);
    const validation = markReadSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          message: "Invalid request data.",
          issues: validation.error.flatten(),
        },
        { status: 422 }
      );
    }

    const { notificationIds } = validation.data;

    // Since we're using client-side localStorage for now, just return success
    // The client will handle storing in localStorage
    return NextResponse.json(
      {
        message: "Notifications marked as read.",
        count: notificationIds.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Failed to mark notifications as read:", error);
    return NextResponse.json(
      {
        message: "Failed to mark notifications as read.",
      },
      { status: 500 }
    );
  }
}

