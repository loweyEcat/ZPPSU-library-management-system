"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  FileText,
  BookOpen,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Globe,
  Bell,
  BellOff,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { Notification } from "@/app/dashboard/student/notifications/actions";

interface StudentNotificationsPanelProps {
  notifications: Notification[];
}

function getNotificationIcon(type: string, status: string) {
  if (type === "thesis") {
    if (status === "Staff_Approved" || status === "Super_Admin_Approved") {
      return <CheckCircle2 className="h-5 w-5 text-green-600" />;
    } else if (status === "Staff_Rejected" || status === "Super_Admin_Rejected") {
      return <XCircle className="h-5 w-5 text-red-600" />;
    } else if (status === "Revision_Requested") {
      return <RefreshCw className="h-5 w-5 text-orange-600" />;
    } else if (status === "Published") {
      return <Globe className="h-5 w-5 text-blue-600" />;
    }
    return <FileText className="h-5 w-5 text-muted-foreground" />;
  } else if (type === "book") {
    return <BookOpen className="h-5 w-5 text-muted-foreground" />;
  }
  return <Bell className="h-5 w-5 text-muted-foreground" />;
}

function getNotificationBadgeVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  if (status === "Staff_Approved" || status === "Super_Admin_Approved" || status === "Published") {
    return "default";
  } else if (status === "Staff_Rejected" || status === "Super_Admin_Rejected") {
    return "destructive";
  } else if (status === "Revision_Requested") {
    return "secondary";
  }
  return "outline";
}

function getStatusLabel(status: string): string {
  if (status === "Staff_Approved") return "Staff Verified";
  if (status === "Super_Admin_Approved") return "Approved";
  if (status === "Staff_Rejected") return "Rejected";
  if (status === "Super_Admin_Rejected") return "Rejected";
  if (status === "Revision_Requested") return "Revision Required";
  if (status === "Published") return "Published";
  return status.replace(/_/g, " ");
}

const STORAGE_KEY = "read_notifications";

function getReadNotifications(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const ids = JSON.parse(stored);
      return new Set(Array.isArray(ids) ? ids : []);
    }
  } catch (error) {
    console.error("Failed to read from localStorage:", error);
  }
  return new Set();
}

function saveReadNotifications(ids: Set<string>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(ids)));
    // Dispatch custom event to notify sidebar
    window.dispatchEvent(new CustomEvent("notifications-updated"));
  } catch (error) {
    console.error("Failed to save to localStorage:", error);
  }
}

export function StudentNotificationsPanel({ notifications }: StudentNotificationsPanelProps) {
  const router = useRouter();
  const [readNotifications, setReadNotifications] = React.useState<Set<string>>(new Set());
  const [isMounted, setIsMounted] = React.useState(false);

  // Sync with localStorage on mount (client-side only)
  React.useEffect(() => {
    setIsMounted(true);
    setReadNotifications(getReadNotifications());
  }, []);

  // Calculate unread count - use empty set on server, actual set on client
  const unreadCount = isMounted
    ? notifications.filter((n) => !readNotifications.has(n.id)).length
    : notifications.length; // On server, show all as unread initially

  const markAsRead = async (notificationId: string) => {
    const newReadSet = new Set(readNotifications).add(notificationId);
    setReadNotifications(newReadSet);
    saveReadNotifications(newReadSet);
    
    // Optionally call API to persist (for future database implementation)
    try {
      await fetch("/api/library/notifications/mark-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationIds: [notificationId] }),
      });
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    const allIds = new Set(notifications.map((n) => n.id));
    setReadNotifications(allIds);
    saveReadNotifications(allIds);
    
    // Optionally call API to persist
    try {
      await fetch("/api/library/notifications/mark-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationIds: Array.from(allIds) }),
      });
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  };

  if (notifications.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <BellOff className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Notifications</h3>
          <p className="text-sm text-muted-foreground text-center">
            You don't have any notifications yet. You'll be notified when your documents are reviewed or book requests are updated.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Your Notifications</CardTitle>
            <CardDescription>
              {unreadCount > 0
                ? `${unreadCount} unread ${unreadCount === 1 ? "notification" : "notifications"}`
                : "All caught up!"}
            </CardDescription>
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllAsRead}>
              Mark all as read
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px] pr-4">
          <div className="space-y-4">
            {notifications.map((notification, index) => {
              const isRead = readNotifications.has(notification.id);
              return (
                <React.Fragment key={notification.id}>
                  <div
                    className={`p-4 rounded-lg border-2 transition-all ${
                      isRead
                        ? "bg-muted/30 border-muted"
                        : "bg-primary/5 border-primary/20 shadow-sm"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">{getNotificationIcon(notification.type, notification.status)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div className="flex-1">
                            <h4 className="font-semibold text-sm">{notification.title}</h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              {notification.message}
                            </p>
                            {/* Staff Review Notes */}
                            {notification.staffReviewNotes && (
                              <div className="mt-3 p-3 rounded-md bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                                <div className="flex items-start gap-2">
                                  <div className="mt-0.5">
                                    <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-xs font-semibold text-blue-900 dark:text-blue-100 mb-1">
                                      Staff Review Notes:
                                    </p>
                                    <p className="text-sm text-blue-800 dark:text-blue-200 whitespace-pre-wrap">
                                      {notification.staffReviewNotes}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}
                            {/* Admin Review Notes */}
                            {notification.adminReviewNotes && (
                              <div className="mt-3 p-3 rounded-md bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800">
                                <div className="flex items-start gap-2">
                                  <div className="mt-0.5">
                                    <FileText className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-xs font-semibold text-purple-900 dark:text-purple-100 mb-1">
                                      Admin Review Notes:
                                    </p>
                                    <p className="text-sm text-purple-800 dark:text-purple-200 whitespace-pre-wrap">
                                      {notification.adminReviewNotes}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Badge
                              variant={getNotificationBadgeVariant(notification.status)}
                              className="text-xs"
                            >
                              {getStatusLabel(notification.status)}
                            </Badge>
                            {!isRead && (
                              <div className="h-2 w-2 rounded-full bg-primary" />
                            )}
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-3">
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(notification.createdAt), {
                              addSuffix: true,
                            })}
                          </span>
                          <div className="flex items-center gap-2">
                            {!isRead && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs"
                                onClick={() => markAsRead(notification.id)}
                              >
                                Mark as read
                              </Button>
                            )}
                            {notification.link && (
                              <Link href={notification.link}>
                                <Button variant="outline" size="sm" className="h-7 text-xs">
                                  View
                                </Button>
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  {index < notifications.length - 1 && <Separator />}
                </React.Fragment>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

