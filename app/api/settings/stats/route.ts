import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const [leads, clients, projects, quotes, tasks, catalogItems, payments, notifications] =
      await Promise.all([
        prisma.lead.count({ where: { deletedAt: null as any } }),
        prisma.client.count({ where: { deletedAt: null as any } }),
        prisma.project.count(),
        prisma.quote.count(),
        prisma.task.count(),
        prisma.catalogItem.count(),
        prisma.payment.count(),
        prisma.notification.count(),
      ])

    return NextResponse.json({
      data: { leads, clients, projects, quotes, tasks, catalogItems, payments, notifications },
    })
  } catch (error) {
    return NextResponse.json({ error: 'שגיאה בטעינת נתוני מערכת' }, { status: 500 })
  }
}
