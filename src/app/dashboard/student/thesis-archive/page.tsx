import { requireStudent } from "@/lib/auth-library";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function ThesisArchivePage() {
  const session = await requireStudent();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Thesis Archive</h2>
        <p className="text-muted-foreground">
          Browse and search thesis documents
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Thesis Archive</CardTitle>
          <CardDescription>
            Search and access thesis documents from the archive
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Thesis archive functionality will be implemented here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

