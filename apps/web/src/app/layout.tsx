import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { QueryProvider } from "@/components/providers/query-provider";
import { I18nProvider, DEFAULT_LOCALE, LOCALES, type Locale } from "@/lib/i18n";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Eventology — Endless Events, One Platform",
    template: "%s | Eventology",
  },
  description:
    "Discover, attend, and organize events in Addis Ababa. The premium event management platform for Ethiopia.",
  keywords: [
    "events",
    "Addis Ababa",
    "Ethiopia",
    "conferences",
    "meetups",
    "ticketing",
    "premium",
  ],
  icons: {
    icon: "/logo.svg",
  },
};

/**
 * R3 / A2: SSR seed for the i18n provider. Read the user's preferred
 * locale from the cookie (set by the client-side switcher) and
 * hand it to the provider so the FIRST server-rendered HTML already
 * matches the user's choice. Falls back to the platform default.
 */
async function resolveInitialLocale(): Promise<Locale> {
  try {
    const store = await cookies();
    const cookie = store.get("eventology:locale")?.value;
    if (cookie && (LOCALES as readonly string[]).includes(cookie)) {
      return cookie as Locale;
    }
  } catch {
    // cookies() may be unavailable in some prerender contexts
  }
  return DEFAULT_LOCALE;
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const initialLocale = await resolveInitialLocale();

  return (
    <html
      lang={initialLocale}
      suppressHydrationWarning
      className={`${plusJakartaSans.variable} ${jetbrainsMono.variable}`}
    >
      <body className="min-h-screen antialiased selection:bg-primary/20">
        <I18nProvider initialLocale={initialLocale}>
          <QueryProvider>
            {children}
            <Toaster position="bottom-right" richColors closeButton />
          </QueryProvider>
        </I18nProvider>
      </body>
    </html>
  );
}

