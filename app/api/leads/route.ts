import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    const leads = await prisma.lead.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(search
          ? {
              OR: [
                { fullName: { contains: search } },
                { primaryPhone: { contains: search } },
                { email: { contains: search } },
                { city: { contains: search } },
              ],
            }
          : {}),
      },
      include: {
        notes: { orderBy: { createdAt: 'desc' }, take: 1 },
        _count: { select: { notes: true, meetings: true, tasks: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ data: leads })
  } catch (error) {
    return NextResponse.json({ error: 'שגיאה בטעינת הלידים' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const lead = await prisma.lead.create({ data: body })
    return NextResponse.json({ data: lead }, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'שגיאה ביצירת הליד' }, { status: 500 })
  }
}
