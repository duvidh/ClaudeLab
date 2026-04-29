import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { calcClientFinancials } from '@/lib/calculations'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        lead: true,
        projects: {
          include: { payments: true, milestones: true },
          orderBy: { createdAt: 'desc' },
        },
        quotes: {
          include: { project: true },
          orderBy: { createdAt: 'desc' },
        },
        invoices: { orderBy: { date: 'desc' } },
        meetings: { orderBy: { date: 'desc' } },
        tasks: { orderBy: { createdAt: 'desc' } },
        files: { orderBy: { createdAt: 'desc' } },
      },
    })
    if (!client) return NextResponse.json({ error: 'לקוח לא נמצא' }, { status: 404 })

    const allPayments = client.projects.flatMap((p) => p.payments)
    const financials = calcClientFinancials(
      client.projects.map((p) => p.contractValue),
      allPayments.map((p) => p.amount)
    )

    return NextResponse.json({ data: { ...client, financials } })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'שגיאה בטעינת הלקוח' }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const client = await prisma.client.update({ where: { id }, data: body })
    return NextResponse.json({ data: client })
  } catch (error) {
    return NextResponse.json({ error: 'שגיאה בעדכון הלקוח' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await (prisma.client as any).update({ where: { id }, data: { deletedAt: new Date() } })
    return NextResponse.json({ data: { success: true } })
  } catch (error) {
    return NextResponse.json({ error: 'שגיאה במחיקת הלקוח' }, { status: 500 })
  }
}
