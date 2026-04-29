import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search') ?? ''

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const suppliers = await (prisma as any).supplier.findMany({
    where: search
      ? { OR: [{ name: { contains: search } }, { contactName: { contains: search } }, { category: { contains: search } }] }
      : undefined,
    orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
  })

  return NextResponse.json({ data: suppliers })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    if (!body.name) return NextResponse.json({ error: 'שם ספק חובה' }, { status: 400 })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supplier = await (prisma as any).supplier.create({ data: body })
    return NextResponse.json({ data: supplier }, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'שגיאה ביצירת הספק' }, { status: 500 })
  }
}
