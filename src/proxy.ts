import { NextRequest, NextResponse } from 'next/server';

const PROTECTED_ROUTES = [
  '/change-password',
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

interface SessionClaims {
  role: string;
  mustChangePassword: boolean;
}

function decodeJwtClaims(token: string): SessionClaims | null {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const base64UrlPayload = parts[1];
    const base64 = base64UrlPayload.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const payload: unknown = JSON.parse(jsonPayload);
    if (
      typeof payload !== 'object' ||
      payload === null ||
      !('role' in payload) ||
      typeof payload.role !== 'string'
    ) {
      return null;
    }

    // Si el token incluye expiración (exp en segundos), validar que siga vigente
    if ('exp' in payload && typeof payload.exp === 'number') {
      const nowSeconds = Math.floor(Date.now() / 1000);
      if (payload.exp < nowSeconds) {
        return null;
      }
    }

    return {
      role: payload.role,
      mustChangePassword:
        'mustChangePassword' in payload &&
        payload.mustChangePassword === true,
    };
  } catch {
    return null;
  }
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionToken = request.cookies.get('corditrans_session')?.value;
  const sessionClaims = sessionToken ? decodeJwtClaims(sessionToken) : null;
  const userRole = sessionClaims?.role ?? null;
  const mustChangePassword = sessionClaims?.mustChangePassword ?? false;
  const hasValidSession = Boolean(sessionToken && sessionClaims);

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
        hasValidSession
          ? mustChangePassword
            ? '/change-password'
            : userRole === 'CONDUCTOR'
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
    if (hasValidSession) {
      return NextResponse.redirect(
        new URL(
          mustChangePassword
            ? '/change-password'
            : userRole === 'CONDUCTOR'
              ? '/driver'
              : '/dashboard',
          request.url,
        ),
      );
    }
    return NextResponse.next();
  }

  const isDriverRoute =
    pathname === '/driver' || pathname.startsWith('/driver/');
  const isConductorProfileRoute =
    pathname === '/profiles' || pathname.startsWith('/profiles/');

  if (hasValidSession && userRole === 'CONDUCTOR' && !isDriverRoute && !isConductorProfileRoute) {
    return NextResponse.redirect(new URL('/driver', request.url));
  }
  if (hasValidSession && isDriverRoute && userRole !== 'CONDUCTOR') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  if (
    hasValidSession &&
    mustChangePassword &&
    pathname !== '/change-password'
  ) {
    return NextResponse.redirect(new URL('/change-password', request.url));
  }

  const isProtectedRoute = PROTECTED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  if (isProtectedRoute && !hasValidSession) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    const redirectResponse = NextResponse.redirect(loginUrl);
    if (sessionToken && !userRole) {
      // Limpia cookie vencida
      redirectResponse.cookies.delete('corditrans_session');
    }
    return redirectResponse;
  }

  if (hasValidSession) {
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
