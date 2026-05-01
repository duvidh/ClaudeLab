import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

async function generateQuoteNumber(): Promise<string> {
  const count = await prisma.quote.count()
  const year = new Date().getFullYear()
  return `Q${year}-${String(count + 1).padStart(4, '0')}`
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const clientId = searchParams.get('clientId')
    const status = searchParams.get('status')

    // Lazily expire quotes past their validUntil date
    await prisma.quote.updateMany({
      where: {
        status: { in: ['SENT', 'DRAFT'] },
        validUntil: { lt: new Date() },
      },
      data: { status: 'EXPIRED' },
    })

    const quotes = await prisma.quote.findMany({
      where: {
        ...(clientId ? { clientId } : {}),
        ...(status ? { status } : {}),
      },
      include: {
        client: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
        items: { select: { unitPrice: true, dimension1: true, dimension2: true } },
        _count: { select: { items: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ data: quotes })
  } catch {
    return NextResponse.json({ error: 'שגיאה בטעינת הצעות המחיר' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const quoteNumber = await generateQuoteNumber()
    const quote = await prisma.quote.create({
      data: { ...body, quoteNumber },
      include: {
        client: true,
        project: true,
        items: { include: { catalogItem: true } },
      },
    })
    return NextResponse.json({ data: quote }, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'שגיאה ביצירת הצעת מחיר' }, { status: 500 })
  }
}
