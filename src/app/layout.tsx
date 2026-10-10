import type { Metadata, Viewport } from 'next';
import { AuthProvider } from '@/providers/authProvider';
import QueryProvider from '@/providers/query-provider';
import './globals.css';

export const metadata: Metadata = {
  title: 'Corditrans Logística',
  description: 'Sistema integral de transporte y logística',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Corditrans',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#17324d',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        <QueryProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}