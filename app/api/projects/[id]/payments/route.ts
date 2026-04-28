import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params
    const body = await req.json()
    const { amount, method, reference, notes, date } = body

    if (!amount) {
      return NextResponse.json({ error: 'סכום הוא שדה חובה' }, { status: 400 })
    }

    const project = await prisma.project.findUnique({ where: { id: projectId }, select: { clientId: true } })
    if (!project) return NextResponse.json({ error: 'פרויקט לא נמצא' }, { status: 404 })

    const payment = await prisma.payment.create({
      data: {
        projectId,
        clientId: project.clientId,
        amount: parseFloat(String(amount)),
        method: method || null,
        reference: reference || null,
        notes: notes || null,
        date: date ? new Date(date) : new Date(),
      },
    })
    return NextResponse.json({ data: payment }, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'שגיאה ברישום התשלום' }, { status: 500 })
  }
}
