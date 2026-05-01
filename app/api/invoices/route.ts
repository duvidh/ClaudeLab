import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

async function generateInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear()
  const count = await prisma.invoice.count()
  return `INV-${year}-${String(count + 1).padStart(4, '0')}`
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const isPaidParam = searchParams.get('isPaid')
    const clientId = searchParams.get('clientId')

    const invoices = await prisma.invoice.findMany({
      where: {
        ...(isPaidParam === 'true' ? { isPaid: true } : isPaidParam === 'false' ? { isPaid: false } : {}),
        ...(clientId ? { clientId } : {}),
      },
      include: { client: { select: { id: true, name: true } } },
      orderBy: { date: 'desc' },
    })
    return NextResponse.json({ data: invoices })
  } catch {
    return NextResponse.json({ error: 'שגיאה בטעינת חשבוניות' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    if (!body.clientId || !body.amount) {
      return NextResponse.json({ error: 'לקוח וסכום חובה' }, { status: 400 })
    }
    const number = await generateInvoiceNumber()
    const invoice = await prisma.invoice.create({
      data: {
        number,
        clientId: body.clientId,
        amount: parseFloat(body.amount),
        date: body.date ? new Date(body.date) : new Date(),
        dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
        isPaid: false,
      },
      include: { client: { select: { id: true, name: true } } },
    })
    return NextResponse.json({ data: invoice }, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'שגיאה ביצירת חשבונית' }, { status: 500 })
  }
}
