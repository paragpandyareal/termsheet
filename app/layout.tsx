import './globals.css';
import type { ReactNode } from 'react';
import { Plus_Jakarta_Sans } from 'next/font/google';

const sans = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });

export const metadata = { title: 'TermSheet', description: 'Net 30 for Business (concept) inside PayPal checkout, with an AI credit analyst.' };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={sans.variable}>
      <body className="min-h-screen">
        <div className="w-full text-center text-[13px] font-semibold py-1.5 px-4" style={{ background: 'var(--blue-soft)', color: 'var(--navy)' }}>
          Concept demo · PayPal sandbox only · Not an offer of credit
        </div>
        {children}
      </body>
    </html>
  );
}
