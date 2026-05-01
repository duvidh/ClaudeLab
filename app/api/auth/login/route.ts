import { NextRequest, NextResponse } from 'next/server'

const COOKIE_NAME = 'crm-session'
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60

async function createToken(): Promise<string> {
  const secret = process.env.AUTH_SECRET ?? 'dev-secret-change-in-production'
  const payloadB64 = btoa(JSON.stringify({ ok: true, exp: Date.now() + COOKIE_MAX_AGE * 1000 }))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const sigBytes = new Uint8Array(
    await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payloadB64))
  )
  const sigB64 = btoa(String.fromCharCode(...sigBytes))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')

  return `${payloadB64}.${sigB64}`
}

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json()
    const adminPassword = process.env.ADMIN_PASSWORD ?? 'admin123'

    if (password !== adminPassword) {
      return NextResponse.json({ error: 'סיסמה שגויה' }, { status: 401 })
    }

    const token = await createToken()
    const res = NextResponse.json({ ok: true })
    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: COOKIE_MAX_AGE,
      path: '/',
    })
    return res
  } catch {
    return NextResponse.json({ error: 'שגיאת שרת' }, { status: 500 })
  }
}
