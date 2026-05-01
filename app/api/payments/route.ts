import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    const projectId = searchParams.get('projectId')
    const method = searchParams.get('method')

    const payments = await prisma.payment.findMany({
      where: {
        ...(projectId ? { projectId } : {}),
        ...(method ? { method } : {}),
        ...(from || to ? {
          date: {
            ...(from ? { gte: new Date(from) } : {}),
            ...(to ? { lte: new Date(to) } : {}),
          },
        } : {}),
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            client: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { date: 'desc' },
    })
    return NextResponse.json({ data: payments })
  } catch {
    return NextResponse.json({ error: 'שגיאה בטעינת תשלומים' }, { status: 500 })
  }
}
