import type { Metadata } from 'next';
import { AuthProvider } from '@/providers/authProvider';
import QueryProvider from '@/providers/query-provider';
import './globals.css';
import { GlobalLoader } from '@/components/GlobalLoader';

// 🚀 Agregamos las propiedades PWA a nivel global
export const metadata: Metadata = {
  title: 'Corditrans Logística',
  description: 'Sistema integral de transporte y logística',
  manifest: '/manifest.json', // 👈 ¡Esto vuelve toda la app instalable como PWA!
  themeColor: '#2563eb',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Corditrans',
  },
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
            <GlobalLoader />
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}