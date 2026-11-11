import './globals.css';
import type { ReactNode } from 'react';
import { Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';

const sans = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono', display: 'swap' });

export const metadata = { title: 'TermSheet', description: 'Net 30 for Business (concept) inside PayPal checkout, with an AI credit analyst.' };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`}>
      <body className="min-h-screen">
        <div className="w-full text-center text-[12px] font-bold tracking-wide py-1 px-4" style={{ background: 'var(--navy)', color: '#fff' }}>
          CONCEPT DEMO · PAYPAL SANDBOX ONLY · NOT AN OFFER OF CREDIT
        </div>
        {children}
      </body>
    </html>
  );
}
