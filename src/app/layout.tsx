import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Confidential Rental Agreement | ZK dApp on Midnight Network',
  description: 'Prove rental deposit capability and sign lease agreements without exposing personal income, credit scores, or identity. Zero-knowledge smart contracts on Midnight Network.',
  keywords: 'midnight network, zero knowledge, rental agreement, lease, privacy, blockchain, compact',
  openGraph: {
    title: 'Confidential Rental Agreement — ZK dApp',
    description: 'Privacy-preserving rental agreement and tenant qualification system on Midnight Network',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}
