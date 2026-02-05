import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { assertContracts } from '../lib/contracts';

if (process.env.NODE_ENV !== 'production') {
  void assertContracts();
}

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'SCOUFF — Private Portal',
  description: 'Invite-only private operations and auction portal',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="bg-[#0a0e1a] text-white">
      <body className={`${inter.className} min-h-screen bg-gradient-to-br from-[#0a0e1a] to-[#101a2b]`}>
        {children}
      </body>
    </html>
  );
}
