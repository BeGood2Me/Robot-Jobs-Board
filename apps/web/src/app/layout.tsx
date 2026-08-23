import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { GoogleAnalytics } from '@next/third-parties/google';
import { Analytics } from '@vercel/analytics/next';
import { SiteFooter } from '@/components/site-footer';
import { SiteNav } from '@/components/site-nav';
import './globals.css';

const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? 'G-6H8HLRSJ6J';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: {
    default: 'Robot Jobs Board',
    template: '%s – Robot Jobs Board',
  },
  description:
    'Robotics jobs board for engineers, technicians, and operators in the United States, United Kingdom, Canada, Australia, and Europe.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.png', type: 'image/png', sizes: '48x48' },
      { url: '/icon-192.png', type: 'image/png', sizes: '192x192' },
    ],
    apple: [{ url: '/apple-icon.png', sizes: '180x180', type: 'image/png' }],
    shortcut: '/favicon.ico',
  },
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable} dark h-full`}>
      <body className="flex min-h-full flex-col overflow-x-clip bg-background font-sans text-foreground antialiased">
        <a
          href="#content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-lg focus:bg-foreground focus:px-3 focus:py-2 focus:text-background"
        >
          Skip to content
        </a>
        <SiteNav />
        <main id="content" className="relative z-0 flex-1">
          {children}
        </main>
        <SiteFooter />
        <Analytics />
        <GoogleAnalytics gaId={gaId} />
      </body>
    </html>
  );
}
