import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_ROUTES = ['/login'];

const PROTECTED_ROUTES = [
  '/dashboard',
  '/drivers',
  '/vehicles',
  '/settings',
  '/yard',
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const sessionToken = request.cookies.get('corditrans_session')?.value;

  console.log('🚀 Proxy ejecutado');
  console.log('📍 Path:', pathname);
  console.log(
    '🔑 Token:',
    sessionToken ? 'Existe' : 'No existe'
  );

  // ==========================================
  // IGNORAR RECURSOS INTERNOS
  // ==========================================

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // ==========================================
  // RAÍZ
  // ==========================================

  if (pathname === '/') {
    return NextResponse.redirect(
      new URL(
        sessionToken ? '/dashboard' : '/login',
        request.url
      )
    );
  }

  // ==========================================
  // LOGIN
  // ==========================================

  if (pathname === '/login') {
    if (sessionToken) {
      return NextResponse.redirect(
        new URL('/dashboard', request.url)
      );
    }

    return NextResponse.next();
  }

  // ==========================================
  // RUTAS PROTEGIDAS
  // ==========================================

  const isProtectedRoute = PROTECTED_ROUTES.some(
    (route) =>
      pathname === route ||
      pathname.startsWith(`${route}/`)
  );

  if (isProtectedRoute && !sessionToken) {
    console.log(
      '⛔ Acceso denegado, redirigiendo a login'
    );

    const loginUrl = new URL('/login', request.url);

    loginUrl.searchParams.set(
      'redirect',
      pathname
    );

    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/login',
    '/dashboard',
    '/dashboard/:path*',
    '/drivers',
    '/drivers/:path*',
    '/vehicles',
    '/vehicles/:path*',
    '/settings',
    '/settings/:path*',
    '/yard',
    '/yard/:path*',
  ],
};