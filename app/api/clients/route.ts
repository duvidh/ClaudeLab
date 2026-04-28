import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search')
    const status = searchParams.get('status')

    const clients = await prisma.client.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(search
          ? {
              OR: [
                { name: { contains: search } },
                { company: { contains: search } },
                { email: { contains: search } },
                { city: { contains: search } },
                { idNumber: { contains: search } },
              ],
            }
          : {}),
      },
      include: {
        _count: { select: { projects: true, quotes: true, invoices: true } },
        projects: { select: { contractValue: true } },
        invoices: { select: { amount: true, isPaid: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ data: clients })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'שגיאה בטעינת הלקוחות' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const client = await prisma.client.create({ data: body })
    return NextResponse.json({ data: client }, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'שגיאה ביצירת הלקוח' }, { status: 500 })
  }
}
