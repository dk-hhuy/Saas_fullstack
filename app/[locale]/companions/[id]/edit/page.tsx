import { getCompanion } from "@/lib/actions/companion.actions";
import { normalizeSessionLocale } from "@/constants/locales";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import CompanionForm from "@/components/CompanionForm";
import DocumentUploadPanel from "@/components/DocumentUploadPanel";
import SubmitMarketplacePanel from "@/components/SubmitMarketplacePanel";
import PageHeader from "@/components/PageHeader";
import { listCompanionDocuments } from "@/lib/actions/document.actions";
import { canUploadDocuments, getDocumentLimitPerCompanion } from "@/lib/plan-access";

interface EditCompanionPageProps {
  params: Promise<{ id: string }>;
}

const EditCompanionPage = async ({ params }: EditCompanionPageProps) => {
  const { id } = await params;
  const { userId } = await auth();

  if (!userId) {
    redirect({ href: "/sign-in" });
  }

  let companion;
  try {
    companion = await getCompanion(id);
  } catch {
    notFound();
  }

  if (companion.author !== userId) {
    notFound();
  }

  const [documents, canUpload, documentLimit] = await Promise.all([
    listCompanionDocuments(id),
    canUploadDocuments(),
    getDocumentLimitPerCompanion(),
  ]);

  return (
    <main className="w-full">
      <PageHeader
        title="Edit Companion"
        description="Update your tutor's name, subject, voice, and visibility."
      />

      <section className="section-card w-full">
        <div className="mx-auto w-full max-w-5xl">
          <CompanionForm
            mode="edit"
            companionId={id}
            initialValues={{
              name: companion.name,
              subject: companion.subject,
              topic: companion.topic,
              voice: companion.voice,
              style: companion.style,
              duration: Number(companion.duration),
              is_public: companion.is_public ?? false,
              system_prompt: companion.system_prompt ?? "",
              session_locale: normalizeSessionLocale(companion.session_locale),
            }}
          />
        </div>
      </section>

      <div className="mx-auto w-full max-w-5xl">
        <SubmitMarketplacePanel
          companionId={id}
          isPublic={companion.is_public ?? false}
          marketplaceStatus={companion.marketplace_status}
          featured={companion.featured}
          initialTags={companion.tags ?? []}
        />

        <DocumentUploadPanel
          companionId={id}
          initialDocuments={documents}
          canUpload={canUpload}
          documentLimit={documentLimit}
        />
      </div>
    </main>
  );
};

export default EditCompanionPage;
