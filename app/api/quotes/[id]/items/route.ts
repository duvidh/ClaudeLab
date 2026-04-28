import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const count = await prisma.quoteItem.count({ where: { quoteId: id } })
    const item = await prisma.quoteItem.create({
      data: { ...body, quoteId: id, sequenceNumber: count + 1 },
      include: { catalogItem: true },
    })
    return NextResponse.json({ data: item }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'שגיאה בהוספת פריט' }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: quoteId } = await params
    const { itemId, ...data } = await req.json()
    const item = await prisma.quoteItem.update({
      where: { id: itemId, quoteId },
      data,
      include: { catalogItem: true },
    })
    return NextResponse.json({ data: item })
  } catch (error) {
    return NextResponse.json({ error: 'שגיאה בעדכון הפריט' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: quoteId } = await params
    const { itemId } = await req.json()
    await prisma.quoteItem.delete({ where: { id: itemId, quoteId } })
    return NextResponse.json({ data: { success: true } })
  } catch (error) {
    return NextResponse.json({ error: 'שגיאה במחיקת הפריט' }, { status: 500 })
  }
}
