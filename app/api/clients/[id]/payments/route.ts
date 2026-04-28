import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const { projectId, amount, method, reference, notes, date } = body

    if (!projectId || !amount) {
      return NextResponse.json({ error: 'פרויקט וסכום הם שדות חובה' }, { status: 400 })
    }

    const payment = await prisma.payment.create({
      data: {
        projectId,
        clientId: id,
        amount: parseFloat(amount),
        method,
        reference,
        notes,
        date: date ? new Date(date) : new Date(),
      },
    })
    return NextResponse.json({ data: payment }, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'שגיאה ברישום התשלום' }, { status: 500 })
  }
}
