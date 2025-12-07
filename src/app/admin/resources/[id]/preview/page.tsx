import { requireAdminOrSuperAdmin } from "@/lib/auth-library";
import { getPublishedDocumentById } from "../../actions";
import { notFound } from "next/navigation";
import { DocumentPreviewPage } from "@/components/admin/document-preview-page";

export default async function DocumentPreviewRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireAdminOrSuperAdmin();
  const { id } = await params;
  const documentId = parseInt(id);

  if (isNaN(documentId)) {
    notFound();
  }

  const document = await getPublishedDocumentById(documentId);

  if (!document) {
    notFound();
  }

  return <DocumentPreviewPage document={document} />;
}

