import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: { client: true, payments: true },
    })
    if (!invoice) return NextResponse.json({ error: 'חשבונית לא נמצאה' }, { status: 404 })
    return NextResponse.json({ data: invoice })
  } catch {
    return NextResponse.json({ error: 'שגיאה בטעינת החשבונית' }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const data: Record<string, unknown> = { ...body }
    if (data.amount !== undefined) data.amount = parseFloat(data.amount as string)
    if (data.date) data.date = new Date(data.date as string)
    if (data.dueDate) data.dueDate = new Date(data.dueDate as string)
    const invoice = await prisma.invoice.update({ where: { id }, data })
    return NextResponse.json({ data: invoice })
  } catch {
    return NextResponse.json({ error: 'שגיאה בעדכון חשבונית' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.invoice.delete({ where: { id } })
    return NextResponse.json({ data: { success: true } })
  } catch {
    return NextResponse.json({ error: 'שגיאה במחיקת חשבונית' }, { status: 500 })
  }
}
