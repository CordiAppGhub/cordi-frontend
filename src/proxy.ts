import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_ROUTES = ['/login'];
const PROTECTED_ROUTES = [
  '/dashboard',
  '/operations',
  '/fleet',
  '/locations',
  '/map',
  '/fuel',
  '/alerts',
  '/reports',
  '/settings',
];

// Rutas estrictamente prohibidas para el rol ANALISTA
const RESTRICTED_FOR_ANALYST = ['/fleet'];

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
  } catch (e) {
    return null;
  }
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionToken = request.cookies.get('corditrans_session')?.value;

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  if (pathname === '/') {
    return NextResponse.redirect(
      new URL(sessionToken ? '/dashboard' : '/login', request.url)
    );
  }

  if (pathname === '/login') {
    if (sessionToken) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  const isProtectedRoute = PROTECTED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  if (isProtectedRoute && !sessionToken) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 🛡️ Bloqueo de seguridad por roles en el Middleware
  if (sessionToken) {
    const userRole = decodeJwtRole(sessionToken);
    
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
  matcher: [
    '/',
    '/login',
    '/dashboard',
    '/dashboard/:path*',
    '/operations',
    '/operations/:path*',
    '/fleet/:path*',
    '/locations',
    '/map',
    '/fuel',
    '/alerts',
    '/reports',
    '/settings',
  ],
};