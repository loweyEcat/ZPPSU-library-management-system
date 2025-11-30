"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  LogOut,
  Settings,
  FileText,
  Archive,
  BookOpen,
  Library,
  Bell,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuBadge,
} from "@/components/ui/sidebar";
import { Logo } from "@/components/ui/logo";
import { ExitImpersonationButton } from "@/components/admin/exit-impersonation-button";

const menuItems = [
  {
    title: "Dashboard",
    url: "/dashboard/student",
    icon: LayoutDashboard,
  },
  {
    title: "Notifications",
    url: "/dashboard/student/notifications",
    icon: Bell,
  },
  {
    title: "Upload Documents",
    url: "/dashboard/student/upload-documents",
    icon: FileText,
  },
  {
    title: "Thesis Archive",
    url: "/dashboard/student/thesis-archive",
    icon: Archive,
  },
  {
    title: "Books",
    url: "/dashboard/student/books",
    icon: BookOpen,
  },
  {
    title: "Resources",
    url: "/dashboard/student/resources",
    icon: Library,
  },
  {
    title: "Settings",
    url: "/dashboard/student/settings",
    icon: Settings,
  },
];

const STORAGE_KEY = "read_notifications";

function getReadNotificationIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const ids = JSON.parse(stored);
      return Array.isArray(ids) ? ids : [];
    }
  } catch (error) {
    console.error("Failed to read from localStorage:", error);
  }
  return [];
}

export function StudentSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [notificationCount, setNotificationCount] = React.useState(0);
  const [isMounted, setIsMounted] = React.useState(false);

  // Fetch notification count
  const fetchNotificationCount = React.useCallback(async () => {
    try {
      const readIds = isMounted ? getReadNotificationIds() : [];
      const url = readIds.length > 0
        ? `/api/library/notifications/count?readIds=${encodeURIComponent(JSON.stringify(readIds))}`
        : "/api/library/notifications/count";
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setNotificationCount(data.count || 0);
      }
    } catch (error) {
      console.error("Failed to fetch notification count:", error);
    }
  }, [isMounted]);

  React.useEffect(() => {
    setIsMounted(true);
    fetchNotificationCount();
    // Refresh count every 30 seconds
    const interval = setInterval(fetchNotificationCount, 30000);
    
    // Listen for custom event when notifications are marked as read
    const handleNotificationUpdate = () => {
      fetchNotificationCount();
    };
    window.addEventListener("notifications-updated", handleNotificationUpdate);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener("notifications-updated", handleNotificationUpdate);
    };
  }, [fetchNotificationCount]);

  // Refresh count when navigating to notifications page
  React.useEffect(() => {
    if (pathname === "/dashboard/student/notifications") {
      fetchNotificationCount();
    }
  }, [pathname, fetchNotificationCount]);

  const handleLogout = React.useCallback(async () => {
    try {
      const response = await fetch("/api/library/logout", {
        method: "POST",
      });
      if (response.ok) {
        router.push("/login");
        router.refresh();
      }
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }, [router]);

  return (
    <Sidebar 
      collapsible="icon"
      className="sidebar-maroon-gradient border-r sidebar-gold-border"
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard/student">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-gradient-to-br from-[hsl(45,100%,55%)] to-[hsl(45,100%,45%)] text-[hsl(340,60%,15%)] shadow-lg shadow-[hsl(45,100%,50%)]/30">
                  <Logo size="sm" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">
                    Library System
                  </span>
                  <span className="truncate text-xs">Student Panel</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const Icon = item.icon;
                // For dashboard, exact match; for others, check if pathname starts with the URL
                const isActive =
                  item.url === "/dashboard/student"
                    ? pathname === item.url
                    : pathname.startsWith(item.url);
                const isNotificationItem = item.url === "/dashboard/student/notifications";
                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                    >
                      <Link href={item.url}>
                        <Icon />
                        <span>{item.title}</span>
                        {isNotificationItem && notificationCount > 0 && (
                          <SidebarMenuBadge className="bg-destructive text-destructive-foreground">
                            {notificationCount > 9 ? "9+" : notificationCount}
                          </SidebarMenuBadge>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <ExitImpersonationButton />
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout} tooltip="Sign Out">
              <LogOut />
              <span>Sign Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

