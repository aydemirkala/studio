import type { Metadata } from 'next';
import { Inter } from 'next/font/google'; // Using Inter as a clean default sans-serif font
import { NextIntlClientProvider, useMessages } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import '../globals.css'; // Adjust path if needed
import { Toaster } from "@/components/ui/toaster";
import { LocaleSwitcher } from '@/components/locale-switcher'; // Import LocaleSwitcher
import {locales} from '@/navigation'; // Import locales

const inter = Inter({ subsets: ['latin'] });

// Define generateStaticParams for SSG
export async function generateStaticParams() {
  return locales.map((locale) => ({locale}));
}

// Define generateMetadata function
export async function generateMetadata({params: {locale}}: {params: {locale: string}}): Promise<Metadata> {
  const t = await getTranslations({locale, namespace: 'Metadata'});

  return {
    title: t('title'),
    description: t('description')
  };
}

export default function RootLayout({
  children,
  params: {locale}
}: Readonly<{
  children: React.ReactNode;
  params: {locale: string};
}>) {
  const messages = useMessages();

  return (
    <html lang={locale}>
      <body className={`${inter.className} antialiased`}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <header className="p-4 flex justify-end"> {/* Add header for locale switcher */}
            <LocaleSwitcher />
          </header>
          {children}
          <Toaster />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
