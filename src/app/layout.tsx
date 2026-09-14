import type { Metadata } from 'next';
import { Inter, Space_Mono } from 'next/font/google';
import './globals.css';
import AppNav from '@/components/AppNav';
import Footer from '@/components/Footer';
import { SITE_URL } from '@/lib/site';

const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'], variable: '--font-inter', display: 'swap' });
const spaceMono = Space_Mono({ subsets: ['latin'], weight: ['400', '700'], variable: '--font-mono', display: 'swap' });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: 'spotted. — find rentals the internet missed',
  description: 'Discover fresh, verified rentals found by people in your neighbourhood.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceMono.variable}`}>
      <body className="bg-paper text-ink font-body pb-24 md:pb-0" suppressHydrationWarning>
        <AppNav />
        {children}
        <Footer />
      </body>
    </html>
  );
}
