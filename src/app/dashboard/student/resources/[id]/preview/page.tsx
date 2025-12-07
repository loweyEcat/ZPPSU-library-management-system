import { notFound } from "next/navigation";
import { getPublishedDocumentByIdForStudent } from "../../actions";
import { StudentDocumentPreviewPage } from "@/components/student/student-document-preview-page";
import { requireStudent } from "@/lib/auth-library";

interface DocumentPreviewRouteProps {
  params: Promise<{ id: string }> | { id: string };
}

export default async function StudentDocumentPreviewRoute({
  params,
}: DocumentPreviewRouteProps) {
  await requireStudent();
  const resolvedParams = await Promise.resolve(params);
  const documentId = parseInt(resolvedParams.id);

  if (isNaN(documentId)) {
    notFound();
  }

  const document = await getPublishedDocumentByIdForStudent(documentId);

  if (!document) {
    notFound();
  }

  return <StudentDocumentPreviewPage document={document} />;
}
