// proxy.ts

import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_ROUTES = ['/login'];
const PROTECTED_ROUTES = [
  '/dashboard',
  '/drivers',
  '/vehicles',
  '/settings',
  '/yard',
];

// 🔥 The exported function must be named 'proxy' in Next.js 16+
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const sessionToken = request.cookies.get('corditrans_session')?.value;

  console.log('🚀 Proxy ejecutado');
  console.log('📍 Path:', pathname);
  console.log('🔑 Token:', sessionToken ? 'Existe' : 'No existe');

  // Ignorar recursos internos
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') // imágenes, js, css, etc.
  ) {
    return NextResponse.next();
  }

  // Raíz
  if (pathname === '/') {
    return NextResponse.redirect(
      new URL(sessionToken ? '/dashboard' : '/login', request.url)
    );
  }

  // Si ya está autenticado y entra a login
  if (pathname === '/login' && sessionToken) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Verificar rutas protegidas
  const isProtectedRoute = PROTECTED_ROUTES.some(
    (route) =>
      pathname === route || pathname.startsWith(`${route}/`)
  );

  if (isProtectedRoute && !sessionToken) {
    console.log('⛔ Acceso denegado, redirigiendo a login');

    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);

    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/login',
    '/dashboard/:path*',
    '/drivers/:path*',
    '/vehicles/:path*',
    '/settings/:path*',
    '/yard/:path*',
  ],
};