import { getOptionalUserId } from "@/lib/auth-helpers";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { redirectToSignIn } from "@/lib/i18n-redirect";
import PageHeader from "@/components/PageHeader";
import SessionUsageBanner from "@/components/SessionUsageBanner";
import SettingsAccountPanel from "@/components/settings/SettingsAccountPanel";
import SettingsPreferences from "@/components/settings/SettingsPreferences";
import SettingsSection from "@/components/settings/SettingsSection";
import { getReminderPreferences } from "@/lib/actions/reminder.actions";
import { getSessionUsage } from "@/lib/actions/usage.actions";
import { defaultSessionUsage } from "@/lib/safe-defaults";

const SettingsPage = async () => {
  const userId = await getOptionalUserId();
  const t = await getTranslations("settings");

  if (!userId) {
    await redirectToSignIn();
  }

  const [usage, reminderPreferences] = await Promise.all([
    getSessionUsage().catch(() => defaultSessionUsage()),
    getReminderPreferences().catch(() => null),
  ]);

  return (
    <main className="w-full">
      <PageHeader title={t("title")} description={t("description")} />

      <div className="flex flex-col gap-6">
        <SettingsPreferences reminderPreferences={reminderPreferences} />

        <SettingsSection
          title={t("subscriptionTitle")}
          description={t("subscriptionDesc")}
        >
          <SessionUsageBanner usage={usage} />
          <div className="flex flex-wrap gap-4">
            <Link href="/subscription" className="btn-primary text-sm">
              {t("manageSubscription")}
            </Link>
            <Link
              href="/pricing"
              className="text-sm font-semibold text-primary transition-colors hover:text-primary/80"
            >
              {t("comparePlans")} →
            </Link>
          </div>
        </SettingsSection>

        <SettingsAccountPanel />
      </div>
    </main>
  );
};

export default SettingsPage;
