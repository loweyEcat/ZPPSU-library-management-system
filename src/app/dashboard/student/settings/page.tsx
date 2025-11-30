import { requireStudent } from "@/lib/auth-library";
import { prisma } from "@/lib/prisma";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StudentSettingsForm } from "@/components/forms/student-settings-form";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ProfilePicturePreview } from "@/components/profile/profile-picture-preview";
import {
  User,
  Mail,
  Shield,
  CheckCircle2,
  Phone,
  GraduationCap,
  Building2,
  BookOpen,
  CreditCard,
} from "lucide-react";

export default async function StudentSettingsPage() {
  const session = await requireStudent();

  // Fetch full user data including assigned_role for section and department
  const user = await prisma.lib_users.findUnique({
    where: { id: session.user.id },
    select: {
      full_name: true,
      contact_number: true,
      year_level: true,
      assigned_role: true,
      profile_image: true,
      student_id: true,
    },
  });

  if (!user) {
    return null;
  }

  // Parse additional info from assigned_role (JSON string)
  let section: string | null = null;
  let department: string | null = null;
  if (user.assigned_role) {
    try {
      const additionalInfo = JSON.parse(user.assigned_role);
      section = additionalInfo.section || null;
      department = additionalInfo.department || null;
    } catch {
      // If parsing fails, leave as null
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Edit Profile</CardTitle>
            <CardDescription>
              Update your personal information, password, and profile picture
            </CardDescription>
          </CardHeader>
          <CardContent>
            <StudentSettingsForm
              initialData={{
                fullName: user.full_name,
                contactNumber: user.contact_number,
                yearLevel: user.year_level,
                section: section,
                department: department,
                profileImage: user.profile_image,
              }}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>Your current profile details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Profile Picture Section */}
              <div className="flex flex-col items-center space-y-3">
                <div className="relative">
                  <ProfilePicturePreview
                    imageUrl={user.profile_image}
                    name={session.user.fullName}
                    initials={session.user.fullName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)}
                    className="h-28 w-28 ring-4 ring-primary/10 shadow-lg"
                  />
                  {session.user.status === "Active" && (
                    <div className="absolute bottom-0 right-0 h-6 w-6 rounded-full bg-green-500 border-4 border-background shadow-sm flex items-center justify-center pointer-events-none">
                      <CheckCircle2 className="h-3 w-3 text-white" />
                    </div>
                  )}
                </div>
                <div className="text-center space-y-1">
                  <h3 className="font-semibold text-md">
                    {/* {session.user.fullName} */}
                    Student ID:
                  </h3>
                  {user.student_id && (
                    <div className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-primary text-primary-foreground text-xs font-semibold shadow-sm">
                      <CreditCard className="h-3 w-3" />
                      <span>{user.student_id}</span>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Profile Details Section */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors">
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground font-medium">
                      Full Name
                    </p>
                    <p className="text-sm font-semibold truncate">
                      {session.user.fullName}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors">
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground font-medium">
                      Email
                    </p>
                    <p className="text-sm font-semibold truncate">
                      {session.user.email}
                    </p>
                  </div>
                </div>

                {user.contact_number && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors">
                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Phone className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground font-medium">
                        Contact
                      </p>
                      <p className="text-sm font-semibold truncate">
                        {user.contact_number}
                      </p>
                    </div>
                  </div>
                )}

                {user.year_level && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors">
                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <GraduationCap className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground font-medium">
                        Year Level
                      </p>
                      <p className="text-sm font-semibold truncate">
                        {user.year_level}
                      </p>
                    </div>
                  </div>
                )}

                {section && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors">
                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <BookOpen className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground font-medium">
                        Section
                      </p>
                      <p className="text-sm font-semibold truncate">
                        {section}
                      </p>
                    </div>
                  </div>
                )}

                {department && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors">
                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground font-medium">
                        Department
                      </p>
                      <p className="text-sm font-semibold truncate">
                        {department}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
