import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic' // <--- השורה שמבטלת את הקאש!

function parseStoredValue(raw: string): unknown {
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export async function GET() {
  try {
    const rows = await prisma.systemSetting.findMany()
    const data: Record<string, unknown> = {}
    for (const row of rows) {
      data[row.key] = parseStoredValue(row.value)
    }
    return NextResponse.json({ data })
  } catch {
    return NextResponse.json({ error: 'שגיאה בטעינת הגדרות' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const settings = body?.settings as Record<string, unknown> | undefined
    if (!settings || typeof settings !== 'object' || Array.isArray(settings)) {
      return NextResponse.json({ error: 'חסר אובייקט settings' }, { status: 400 })
    }
    for (const [key, val] of Object.entries(settings)) {
      if (val === undefined) continue
      const value = JSON.stringify(val)
      await prisma.systemSetting.upsert({
        where: { key },
        create: { key, value },
        update: { value },
      })
    }
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'שגיאה בשמירת הגדרות' }, { status: 500 })
  }
}