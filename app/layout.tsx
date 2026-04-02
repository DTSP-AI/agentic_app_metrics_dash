import type { Metadata } from 'next';
import './globals.css';
import Providers from '@/components/Providers';

const appName = process.env.NEXT_PUBLIC_APP_NAME || 'Agent Metrics Dashboard';

export const metadata: Metadata = {
  title: appName,
  description: 'Observability dashboard for agent-based applications — LLM usage, costs, revenue projections, and pricing optimization.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#0a0a0a] text-gray-100 antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
