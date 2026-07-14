import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Mail, MapPin, Phone } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import {
  CONTACT_ADDRESS_LINES,
  CONTACT_ADDRESS_MAPS_URL,
  CONTACT_EMAIL,
  CONTACT_PHONE_DISPLAY,
  CONTACT_PHONE_TEL,
} from "@/constants/contact";
import { Link } from "@/i18n/navigation";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("contact");
  return {
    title: `${t("title")} | TutorForge`,
    description: t("description"),
  };
}

const ContactPage = async () => {
  const t = await getTranslations("contact");

  return (
    <main className="flex flex-col gap-10">
      <PageHeader title={t("title")} description={t("description")} />

      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-semibold">{t("reachTitle")}</h2>
          <p className="text-sm text-muted-foreground">{t("reachDesc")}</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="section-card flex items-start gap-4 transition-colors hover:border-primary/40"
          >
            <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Mail size={20} aria-hidden />
            </span>
            <span className="flex flex-col gap-1">
              <span className="text-sm font-semibold">{t("emailLabel")}</span>
              <span className="text-base font-medium text-foreground">
                {CONTACT_EMAIL}
              </span>
              <span className="text-sm text-muted-foreground">
                {t("emailHint")}
              </span>
            </span>
          </a>

          <a
            href={`tel:${CONTACT_PHONE_TEL}`}
            className="section-card flex items-start gap-4 transition-colors hover:border-primary/40"
          >
            <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Phone size={20} aria-hidden />
            </span>
            <span className="flex flex-col gap-1">
              <span className="text-sm font-semibold">{t("phoneLabel")}</span>
              <span className="text-base font-medium text-foreground">
                {CONTACT_PHONE_DISPLAY}
              </span>
              <span className="text-sm text-muted-foreground">
                {t("phoneHint")}
              </span>
            </span>
          </a>

          <a
            href={CONTACT_ADDRESS_MAPS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="section-card flex items-start gap-4 transition-colors hover:border-primary/40 sm:col-span-2 lg:col-span-1"
          >
            <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <MapPin size={20} aria-hidden />
            </span>
            <span className="flex flex-col gap-1">
              <span className="text-sm font-semibold">{t("addressLabel")}</span>
              <span className="text-base font-medium leading-snug text-foreground">
                {CONTACT_ADDRESS_LINES.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </span>
              <span className="text-sm text-muted-foreground">
                {t("addressHint")}
              </span>
            </span>
          </a>
        </div>
      </section>

      <section className="section-card flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-bold tracking-tight">{t("ctaTitle")}</h2>
          <p className="max-w-xl text-muted-foreground">{t("ctaDesc")}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/companions" className="btn-primary">
            {t("browseCompanions")}
          </Link>
          <Link
            href="/faq"
            className="inline-flex items-center rounded-xl border border-border px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-muted"
          >
            {t("visitFaq")}
          </Link>
        </div>
      </section>
    </main>
  );
};

export default ContactPage;
