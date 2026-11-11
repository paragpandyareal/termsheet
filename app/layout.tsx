import './globals.css';
import type { ReactNode } from 'react';

export const metadata = { title: 'TermSheet', description: 'Net 30 for Business (concept) inside PayPal checkout, with an AI credit analyst.' };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <div className="w-full text-center text-xs font-semibold py-1.5 px-4" style={{ background: 'var(--accent-soft)', color: 'var(--ink)' }}>
          Concept demo. PayPal sandbox only. Not an offer of credit.
        </div>
        {children}
      </body>
    </html>
  );
}
