"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  LogOut,
  Settings,
  MessageSquare,
  BookOpen,
  FileCheck,
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
} from "@/components/ui/sidebar";
import { Logo } from "@/components/ui/logo";
import { ExitImpersonationButton } from "@/components/admin/exit-impersonation-button";

const menuItems = [
  {
    title: "Dashboard",
    url: "/dashboard/staff",
    icon: LayoutDashboard,
  },
  {
    title: "Documents Verification Panel",
    url: "/dashboard/staff/thesis-verification",
    icon: FileCheck,
  },
  // {
  //   title: "Students Inquiries",
  //   url: "/dashboard/staff/inquiries",
  //   icon: MessageSquare,
  // },
  // {
  //   title: "Books Requested",
  //   url: "/dashboard/staff/books-requested",
  //   icon: BookOpen,
  // },
  {
    title: "Settings",
    url: "/dashboard/staff/settings",
    icon: Settings,
  },
];

export function StaffSidebar() {
  const pathname = usePathname();
  const router = useRouter();

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
              <Link href="/dashboard/staff">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-gradient-to-br from-[hsl(45,100%,55%)] to-[hsl(45,100%,45%)] text-[hsl(340,60%,15%)] shadow-lg shadow-[hsl(45,100%,50%)]/30">
                  <Logo size="sm" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Library System</span>
                  <span className="truncate text-xs">Staff Panel</span>
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
                  item.url === "/dashboard/staff"
                    ? pathname === item.url
                    : pathname.startsWith(item.url);
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
