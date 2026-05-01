import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET — list all soft-deleted leads and clients
export async function GET() {
  try {
    const [leads, clients] = await Promise.all([
      prisma.lead.findMany({
        where: { deletedAt: { not: null } },
        select: { id: true, fullName: true, primaryPhone: true, status: true, deletedAt: true },
        orderBy: { deletedAt: 'desc' },
      }),
      prisma.client.findMany({
        where: { deletedAt: { not: null } },
        select: { id: true, name: true, city: true, status: true, deletedAt: true },
        orderBy: { deletedAt: 'desc' },
      }),
    ])

    return NextResponse.json({
      data: {
        leads: leads.map((l) => ({ ...l, type: 'lead' as const })),
        clients: clients.map((c) => ({ ...c, type: 'client' as const })),
      },
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'שגיאה בטעינת סל המחזור' }, { status: 500 })
  }
}

// POST — restore or permanently delete an item
// body: { type: 'lead' | 'client', id: string, action: 'restore' | 'delete' }
export async function POST(req: NextRequest) {
  try {
    const { type, id, action } = await req.json()

    if (type === 'lead') {
      if (action === 'restore') {
        await prisma.lead.update({ where: { id }, data: { deletedAt: null } })
      } else {
        await prisma.lead.delete({ where: { id } })
      }
    } else if (type === 'client') {
      if (action === 'restore') {
        await prisma.client.update({ where: { id }, data: { deletedAt: null } })
      } else {
        await prisma.client.delete({ where: { id } })
      }
    }

    return NextResponse.json({ data: { success: true } })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'שגיאה בפעולה' }, { status: 500 })
  }
}
