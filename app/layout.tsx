import type { Metadata } from 'next';
import { MotionProvider } from '../components/MotionProvider';
import './globals.css';

export const metadata: Metadata = {
  title: 'Liquid incident | Cache bug and 3,998.67 BTC payout',
  description: 'Public evidence, current network status and a visual explanation of the cache bug linked to the September 2026 Liquid incident.',
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
