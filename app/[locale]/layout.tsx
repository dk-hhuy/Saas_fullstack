import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import "../globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ThemeProvider } from "@/components/ThemeProvider";
import PlatformAssistant from "@/components/PlatformAssistant";
import { routing, type AppLocale } from "@/i18n/routing";
import { fontVariables } from "@/lib/fonts";

export const metadata: Metadata = {
  title: "TutorForge",
  description: "Real-time AI Teaching Platform",
  icons: {
    icon: [{ url: "/icon.png", type: "image/png" }],
    apple: [{ url: "/apple-icon.png", type: "image/png" }],
  },
};

// auth() requires clerkMiddleware at request time — avoid SSG prerender without middleware context
export const dynamic = "force-dynamic";

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as AppLocale)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`${fontVariables} flex min-h-screen flex-col font-sans antialiased`}>
        <ClerkProvider
          appearance={{
            variables: { colorPrimary: "#fe5933" },
            cssLayerName: "clerk",
          }}
        >
          <NextIntlClientProvider messages={messages}>
            <ThemeProvider>
              <Navbar />
              <div className="flex-1">{children}</div>
              <Footer />
              <PlatformAssistant />
            </ThemeProvider>
          </NextIntlClientProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
