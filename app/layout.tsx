import type { Metadata } from 'next';
import { MotionProvider } from '../components/MotionProvider';
import './globals.css';

const SITE_URL = 'https://mars-llm.github.io/liquid-implosion/';
const TITLE = 'Liquid Implosion | September 2026 Liquid cache bug';
const DESCRIPTION = 'How a cache bug moved almost 4,000 BTC out of Liquid’s reserve, what has reopened, and what the public record still cannot answer.';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    'Liquid Network',
    'Elements',
    'Bitcoin',
    'cache bug',
    'federation wallet',
    'range proof',
    'September 2026 Liquid incident',
  ],
  alternates: {
    canonical: SITE_URL,
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: 'website',
    url: SITE_URL,
    siteName: 'Liquid Implosion',
    title: TITLE,
    description: DESCRIPTION,
    images: [
      {
        url: `${SITE_URL}social-card.png`,
        width: 1200,
        height: 630,
        alt: 'Liquid Implosion: the September 2026 Liquid cache bug and 3,998.67 BTC payout',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
    images: [`${SITE_URL}social-card.png`],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="antialiased">
      <body className="min-h-[100dvh] bg-canvas text-ink selection:bg-accent selection:text-canvas">
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  );
}
