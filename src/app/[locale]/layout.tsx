import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css"; // Moved up one level
import { Toaster } from "sonner";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Nuzul - Your Spiritual Journey Partner",
  description: "Track prayers, complete good deeds, compete with your community, and strengthen your faith this Ramadan",
  manifest: "/manifest.json",
  metadataBase: new URL('https://www.nuzul.xyz'),
  openGraph: {
    title: "Nuzul - Your Spiritual Journey Partner",
    description: "Track prayers, complete good deeds, compete with your community, and strengthen your faith this Ramadan",
    url: "https://www.nuzul.xyz",
    siteName: "Nuzul",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Nuzul - Your Spiritual Journey Partner",
      },
    ],
    locale: "bn_BD",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Nuzul - Your Spiritual Journey Partner",
    description: "Track prayers, complete good deeds, compete with your community, and strengthen your faith this Ramadan",
    images: ["/og-image.png"],
    creator: "@nuzul_app",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Nuzul",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport = {
  themeColor: "#047857",
};

import ErrorReporter from "@/components/error/ErrorReporter";
import NotificationPrompt from "@/components/notifications/NotificationPrompt";
import ClientProviders from "@/components/providers/ClientProviders";

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Ensure that the incoming `locale` is valid
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning={true}
      >
        <NextIntlClientProvider messages={messages}>
          <ClientProviders>
            <ErrorReporter />
            <NotificationPrompt />
            {children}
            <Toaster position="bottom-center" richColors theme="dark" />
          </ClientProviders>
        </NextIntlClientProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
