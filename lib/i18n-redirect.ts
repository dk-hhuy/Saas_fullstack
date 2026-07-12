import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";

export async function localizedRedirect(href: string) {
  redirect({ href, locale: await getLocale() });
}

export async function redirectToSignIn() {
  return localizedRedirect("/sign-in");
}
