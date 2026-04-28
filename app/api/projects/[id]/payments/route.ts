import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { notify } from '@/lib/notify'

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

    const project = await prisma.project.findUnique({ where: { id: projectId }, select: { clientId: true, name: true } })
    if (!project) return NextResponse.json({ error: 'פרויקט לא נמצא' }, { status: 404 })

    const parsedAmount = parseFloat(String(amount))
    const payment = await prisma.payment.create({
      data: {
        projectId,
        clientId: project.clientId,
        amount: parsedAmount,
        method: method || null,
        reference: reference || null,
        notes: notes || null,
        date: date ? new Date(date) : new Date(),
      },
    })
    await notify(
      `תשלום של ₪${parsedAmount.toLocaleString('he-IL')} נרשם לפרויקט "${project.name}"`,
      'success',
      `project:${projectId}`
    )
    return NextResponse.json({ data: payment }, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'שגיאה ברישום התשלום' }, { status: 500 })
  }
}
