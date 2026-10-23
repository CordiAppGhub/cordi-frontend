import { NextRequest, NextResponse } from 'next/server';

const PROTECTED_ROUTES = [
  '/dashboard',
  '/profiles',
  '/operations',
  '/programacion',
  '/fleet',
  '/locations',
  '/novedades',
  '/tariff',
  '/user',
  '/map',
  '/fuel',
  '/alerts',
  '/reports',
  '/settings',
];

const RESTRICTED_FOR_ANALYST = ['/fleet', '/locations', '/programacion'];

function decodeJwtRole(token: string): string | null {
  try {
    const base64UrlPayload = token.split('.')[1];
    const base64 = base64UrlPayload.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const payload = JSON.parse(jsonPayload);
    return payload.role || null;
  } catch {
    return null;
  }
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionToken = request.cookies.get('corditrans_session')?.value;
  const userRole = sessionToken ? decodeJwtRole(sessionToken) : null;

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  if (pathname === '/') {
    const installEntry = request.cookies.get('cordibot_pwa_entry')?.value;
    return NextResponse.redirect(
      new URL(
        sessionToken
          ? userRole === 'CONDUCTOR'
            ? '/driver'
            : '/dashboard'
          : installEntry === 'driver'
            ? '/driver'
            : '/login',
        request.url,
      ),
    );
  }

  if (pathname === '/login') {
    if (sessionToken) {
      return NextResponse.redirect(
        new URL(userRole === 'CONDUCTOR' ? '/driver' : '/dashboard', request.url),
      );
    }
    return NextResponse.next();
  }

  const isDriverRoute =
    pathname === '/driver' || pathname.startsWith('/driver/');
  const isConductorProfileRoute =
    pathname === '/profiles' || pathname.startsWith('/profiles/');
  if (userRole === 'CONDUCTOR' && !isDriverRoute && !isConductorProfileRoute) {
    return NextResponse.redirect(new URL('/driver', request.url));
  }
  if (sessionToken && isDriverRoute && userRole !== 'CONDUCTOR') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  const isProtectedRoute = PROTECTED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  if (isProtectedRoute && !sessionToken) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (sessionToken) {
    const isRestrictedRoute = RESTRICTED_FOR_ANALYST.some(
      (route) => pathname === route || pathname.startsWith(`${route}/`)
    );

    if (isRestrictedRoute && userRole === 'ANALISTA') {
      console.log('⛔ Intento de acceso no autorizado de un Analista a la ruta:', pathname);
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/:path*'],
};