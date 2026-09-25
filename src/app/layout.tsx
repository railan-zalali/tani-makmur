import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-plus-jakarta',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
});
import { CartProvider } from '@/context/CartContext';
import { CategoryProvider } from '@/context/CategoryContext';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { CartDrawer } from '@/components/CartDrawer';
import { FloatingCartBtn } from '@/components/FloatingCartBtn';
import { siteConfig } from '@/config/site';

export const metadata: Metadata = {
  title: {
    default: `${siteConfig.name} — Katalog Pupuk & Nutrisi Pertanian`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: [
    'toko pupuk',
    'pupuk urea',
    'npk mutiara',
    'pupuk organik',
    'pupuk hayati',
    'em4',
    'pestisida',
    'gandasil',
    'poc nasa',
    'tani makmur',
  ],
  authors: [{ name: siteConfig.name }],
  openGraph: {
    title: `${siteConfig.name} — Katalog Pupuk Terlengkap`,
    description: siteConfig.description,
    type: 'website',
    locale: 'id_ID',
    siteName: siteConfig.name,
  },
  manifest: '/manifest.json',
};

export const viewport = {
  themeColor: '#059669',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={`scroll-smooth ${plusJakartaSans.variable}`}>
      <body className="min-h-screen flex flex-col bg-stone-50 text-stone-900 font-sans selection:bg-emerald-200 selection:text-emerald-900">
        <CategoryProvider>
          <CartProvider>
            <Navbar />
            <main className="flex-1">
              {children}
            </main>
            <Footer />
            <CartDrawer />
            <FloatingCartBtn />
          </CartProvider>
        </CategoryProvider>
      </body>
    </html>
  );
}
