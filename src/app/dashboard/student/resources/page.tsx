import { requireStudent } from "@/lib/auth-library";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function ResourcesPage() {
  const session = await requireStudent();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Resources</h2>
        <p className="text-muted-foreground">
          Access library resources and materials
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Library Resources</CardTitle>
          <CardDescription>
            Access digital resources, e-books, and other materials
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Resources functionality will be implemented here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

