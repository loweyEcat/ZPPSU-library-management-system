import { requireStaffOrAbove } from "@/lib/auth-library";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function StudentsInquiriesPage() {
  const session = await requireStaffOrAbove();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Students Inquiries</h2>
        <p className="text-muted-foreground">
          Manage and respond to student inquiries
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Inquiries</CardTitle>
          <CardDescription>
            View and manage student inquiries and questions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Student inquiries management will be implemented here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

