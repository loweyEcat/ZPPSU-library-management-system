import { requireStaffOrAbove } from "@/lib/auth-library";
import { getThesisDocumentById } from "../../actions";
import { notFound } from "next/navigation";
import { StaffDocumentPreviewPage } from "@/components/staff/staff-document-preview-page";

export default async function StaffDocumentPreviewRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireStaffOrAbove();
  const { id } = await params;
  const documentId = parseInt(id);

  if (isNaN(documentId)) {
    notFound();
  }

  const document = await getThesisDocumentById(documentId);

  if (!document) {
    notFound();
  }

  return <StaffDocumentPreviewPage document={document} />;
}

