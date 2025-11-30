import { requireStudent } from "@/lib/auth-library";
import { getStudentNotifications } from "./actions";
import { StudentNotificationsPanel } from "@/components/student/student-notifications-panel";
import { Bell } from "lucide-react";

export default async function NotificationsPage() {
  const session = await requireStudent();
  const notifications = await getStudentNotifications();

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Bell className="h-8 w-8 text-primary" />
            <h2 className="text-3xl font-bold tracking-tight">Notifications</h2>
          </div>
          <p className="text-muted-foreground">
            Stay updated with your thesis document reviews and book request status.
          </p>
        </div>
      </div>

      {/* Notifications Panel */}
      <StudentNotificationsPanel notifications={notifications} />
    </div>
  );
}

