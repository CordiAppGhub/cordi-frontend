import type { Viewport } from 'next';
import { PwaInstallPrompt } from '@/components/organisms/pwa-install-prompt/pwa-install-prompt';
import { AuthProvider } from '@/providers/authProvider';
import QueryProvider from '@/providers/query-provider';
import './globals.css';


export const metadata = {
  title: 'Cordibot | Corditrans',
  description: 'Plataforma logística para conductores y personal administrativo',
  manifest: '/manifest.json',
  icons: {
    icon: '/icons/cordibot-icon.svg',
    apple: '/icons/icon-192x192.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Cordibot',
  },
};
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#15304a',
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
            <PwaInstallPrompt />
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}