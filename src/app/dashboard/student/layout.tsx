import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { StudentSidebar } from "@/components/admin/student-sidebar";
import { Separator } from "@/components/ui/separator";
import { StudentHeaderProfile } from "@/components/student/student-header-profile";
import { requireStudent } from "@/lib/auth-library";

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireStudent();
  return (
    <SidebarProvider>
      <StudentSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b px-4">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <h1 className="text-lg font-semibold hidden md:block">
              Student Dashboard
            </h1>
          </div>
          <StudentHeaderProfile session={session} />
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
