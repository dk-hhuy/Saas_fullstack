import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

const Footer = async () => {
  const t = await getTranslations("footer");
  const tc = await getTranslations("common");

  const productLinks = [
    { label: t("howItWorks"), href: "/how-it-works" },
    { label: t("faq"), href: "/faq" },
    { label: t("pricing"), href: "/pricing" },
    { label: t("contact"), href: "/contact" },
    { label: t("companions"), href: "/companions" },
    { label: t("myJourney"), href: "/my-journey" },
    { label: t("subscription"), href: "/subscription" },
  ];

  const legalLinks = [
    { label: t("privacy"), href: "/privacy" },
    { label: t("terms"), href: "/terms" },
  ];

  return (
    <footer className="mt-auto border-t border-border bg-card">
      <div className="flex w-full flex-col gap-6 px-6 py-6 md:px-10 lg:px-14">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="flex flex-col gap-2">
            <p className="font-semibold text-foreground">{tc("brand")}</p>
            <p className="max-w-md text-sm text-muted-foreground">{t("tagline")}</p>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:gap-10">
            <nav className="flex flex-wrap gap-x-6 gap-y-2">
              {productLinks.map(({ label, href }) => (
                <Link
                  key={href}
                  href={href}
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {label}
                </Link>
              ))}
            </nav>
            <nav className="flex flex-wrap gap-x-6 gap-y-2">
              {legalLinks.map(({ label, href }) => (
                <Link
                  key={href}
                  href={href}
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>
        </div>

        <div className="flex flex-col items-start justify-between gap-2 border-t border-border pt-4 text-sm text-muted-foreground md:flex-row md:items-center">
          <p>© {new Date().getFullYear()} {t("copyright")}</p>
          <p>{t("learnTagline")}</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
