import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

async function generateQuoteNumber(): Promise<string> {
  const count = await prisma.quote.count()
  const year = new Date().getFullYear()
  return `Q${year}-${String(count + 1).padStart(4, '0')}`
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const original = await prisma.quote.findUnique({
      where: { id },
      include: { items: true },
    })
    if (!original) return NextResponse.json({ error: 'הצעת מחיר לא נמצאה' }, { status: 404 })

    const quoteNumber = await generateQuoteNumber()

    const duplicate = await prisma.quote.create({
      data: {
        quoteNumber,
        clientId: original.clientId,
        projectId: original.projectId,
        status: 'DRAFT',
        version: original.version + 1,
        discount: original.discount,
        paymentTerms: original.paymentTerms,
        notes: original.notes,
        validUntil: original.validUntil,
        items: {
          create: original.items.map(({ id: _id, quoteId: _qid, ...item }) => item),
        },
      },
    })

    return NextResponse.json({ data: duplicate }, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'שגיאה בשכפול הצעת המחיר' }, { status: 500 })
  }
}
