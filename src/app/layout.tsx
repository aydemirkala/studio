import type { Metadata } from 'next';
import { Inter } from 'next/font/google'; // Using Inter as a clean default sans-serif font
import './globals.css';
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'HeartBeat Hub',
  description: 'Track your blood pressure and heart rate readings.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
