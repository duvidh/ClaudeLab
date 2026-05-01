import { NextRequest, NextResponse } from 'next/server'

const COOKIE_NAME = 'crm-session'

async function verifyToken(token: string): Promise<boolean> {
  try {
    const secret = process.env.AUTH_SECRET ?? 'dev-secret-change-in-production'
    const [payloadB64, sigB64] = token.split('.')
    if (!payloadB64 || !sigB64) return false

    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    )
    const sig = Uint8Array.from(
      atob(sigB64.replace(/-/g, '+').replace(/_/g, '/')),
      (c) => c.charCodeAt(0)
    )
    const valid = await crypto.subtle.verify(
      'HMAC', key, sig, new TextEncoder().encode(payloadB64)
    )
    if (!valid) return false

    const data = JSON.parse(atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/')))
    return !!data.ok && data.exp > Date.now()
  } catch {
    return false
  }
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon')
  ) {
    return NextResponse.next()
  }

  const token = req.cookies.get(COOKIE_NAME)?.value
  if (!token || !(await verifyToken(token))) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const url = new URL('/login', req.url)
    url.searchParams.set('from', pathname)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon\\.ico).*)'],
}
