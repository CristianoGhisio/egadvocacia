import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
    function middleware(req) {
        const url = req.nextUrl
        const pathname = url.pathname
        const token = (req as unknown as { nextauth?: { token?: { role?: string } } }).nextauth?.token
        if (pathname.startsWith('/dashboard/settings') || pathname.startsWith('/api/settings')) {
            const role = token?.role || ''
            if (!['admin', 'partner'].includes(role)) {
                if (pathname.startsWith('/api/')) {
                    return new NextResponse('Forbidden', { status: 403 })
                }
                return NextResponse.redirect(new URL('/dashboard', req.url))
            }
        }
        return NextResponse.next()
    },
    {
        callbacks: {
            authorized: ({ token }) => !!token,
        },
        pages: {
            signIn: '/auth/login',
        },
    }
)

export const config = {
    matcher: [
        '/dashboard/:path*',
        '/api/settings/:path*',
    ],
}
