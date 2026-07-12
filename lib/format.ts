import type { AppLocale } from "@/i18n/routing";

export function formatDate(
  value: string | Date,
  locale: AppLocale = "en",
  options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
  }
) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat(locale, options).format(date);
}

export function formatNumber(value: number, locale: AppLocale = "en") {
  return new Intl.NumberFormat(locale).format(value);
}

export function formatDurationMinutes(seconds: number, locale: AppLocale = "en") {
  const minutes = Math.max(1, Math.round(seconds / 60));
  return formatNumber(minutes, locale);
}
