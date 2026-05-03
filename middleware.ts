import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.AUTH_SECRET })
  if (!token) {
    const url = new URL('/login', req.nextUrl.origin)
    url.searchParams.set('from', req.nextUrl.pathname)
    return NextResponse.redirect(url)
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!login|api/auth|_next/static|_next/image|favicon\\.ico).*)'],
}
