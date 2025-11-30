import { NextResponse } from "next/server";
import { getStudentNotifications } from "@/app/dashboard/student/notifications/actions";

export async function GET(request: Request) {
  try {
    const notifications = await getStudentNotifications();
    
    // Get read notification IDs from query params (sent by client)
    const { searchParams } = new URL(request.url);
    const readIdsParam = searchParams.get("readIds");
    const readIds = readIdsParam ? JSON.parse(readIdsParam) : [];
    const readSet = new Set(Array.isArray(readIds) ? readIds : []);
    
    // Filter out read notifications
    const unreadCount = notifications.filter((n) => !readSet.has(n.id)).length;
    
    return NextResponse.json({ count: unreadCount });
  } catch (error) {
    console.error("Failed to get notification count:", error);
    return NextResponse.json({ count: 0 }, { status: 500 });
  }
}

