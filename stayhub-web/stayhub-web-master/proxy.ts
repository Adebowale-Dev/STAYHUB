import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
    const path = request.nextUrl.pathname;
    const isPublicPath = path === '/login' || path === '/forgot-password' || path.startsWith('/reset-password');
    const isAdminPath = path.startsWith('/admin');
    const isStudentPath = path.startsWith('/student');
    const isPorterPath = path.startsWith('/porter');

    if (isPublicPath) {
        return NextResponse.next();
    }

    if (isAdminPath || isStudentPath || isPorterPath) {
        return NextResponse.next();
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)',
    ],
};