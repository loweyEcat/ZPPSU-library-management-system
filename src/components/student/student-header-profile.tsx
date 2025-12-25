"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, User } from "lucide-react";
import Link from "next/link";

interface AuthenticatedUser {
  id: number;
  fullName: string;
  email: string;
  userRole: "Super_Admin" | "Admin" | "Staff" | "Student";
  contactNumber: string | null;
  profileImage: string | null;
  status: "Active" | "Inactive" | "Suspended";
}

interface SessionPayload {
  id: number;
  token: string;
  expiresAt: Date;
  user: AuthenticatedUser;
}

interface StudentHeaderProfileProps {
  session: SessionPayload;
}

export function StudentHeaderProfile({ session }: StudentHeaderProfileProps) {
  const router = useRouter();
  const [unreadCount, setUnreadCount] = React.useState(0);

  const studentName = session.user.fullName;
  const studentEmail = session.user.email;
  const profileImage = session.user.profileImage;

  // Fetch unread notification count on mount
  React.useEffect(() => {
    const fetchNotificationCount = async () => {
      try {
        // Get read notification IDs from localStorage
        const readIds =
          typeof window !== "undefined"
            ? JSON.parse(localStorage.getItem("read_notifications") || "[]")
            : [];

        const response = await fetch(
          `/api/library/notifications/count?readIds=${encodeURIComponent(
            JSON.stringify(readIds)
          )}`
        );
        if (response.ok) {
          const data = await response.json();
          setUnreadCount(data.count);
        }
      } catch (error) {
        console.error("Failed to fetch notification count:", error);
      }
    };

    fetchNotificationCount();

    // Listen for notification updates
    const handleNotificationsUpdated = () => {
      fetchNotificationCount();
    };

    window.addEventListener(
      "notifications-updated",
      handleNotificationsUpdated
    );

    return () => {
      window.removeEventListener(
        "notifications-updated",
        handleNotificationsUpdated
      );
    };
  }, []);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="flex items-center gap-2">
      {/* Notifications Bell */}
      <Link href="/dashboard/student/notifications">
        <Button
          variant="ghost"
          size="icon"
          className="relative border-2 border-primary rounded-full p-1"
        >
          <Bell className="h-5 w-5  " />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </Link>

      {/* Profile Section */}
      <div className="flex items-center gap-3 ">
        <Avatar className="h-9 w-9 border border-primary ">
          <AvatarImage src={profileImage || undefined} alt={studentName} />
          <AvatarFallback className="text-xs">
            {getInitials(studentName)}
          </AvatarFallback>
        </Avatar>
        <div className="hidden md:block">
          <p className="text-sm font-medium leading-none">{studentName}</p>
          <p className="text-xs text-muted-foreground">{studentEmail}</p>
        </div>
      </div>
    </div>
  );
}
