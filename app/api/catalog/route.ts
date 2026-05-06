import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search') ?? searchParams.get('q')
    const activeOnly = searchParams.get('active') !== 'false'

    const items = await prisma.catalogItem.findMany({
      where: {
        ...(activeOnly ? { isActive: true } : {}),
        ...(search ? {
          OR: [
            { name: { contains: search } },
            { sku: { contains: search } },
            { category: { contains: search } },
          ],
        } : {}),
      },
      orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
    })
    return NextResponse.json({ data: items })
  } catch {
    return NextResponse.json({ error: 'שגיאה בטעינת הקטלוג' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const item = await prisma.catalogItem.create({ data: body })
    return NextResponse.json({ data: item }, { status: 201 })
  } catch (error) {
    const msg = error instanceof Error ? error.message : ''
    if (msg.includes('Unique constraint') || msg.includes('unique constraint')) {
      const field = msg.includes('sku') ? 'מק"ט' : 'שם פריט'
      return NextResponse.json({ error: `${field} כבר קיים במערכת` }, { status: 409 })
    }
    return NextResponse.json({ error: 'שגיאה ביצירת פריט' }, { status: 500 })
  }
}
