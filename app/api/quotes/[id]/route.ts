import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const quote = await prisma.quote.findUnique({
      where: { id },
      include: {
        client: true,
        project: true,
        items: {
          include: { catalogItem: true },
          orderBy: { sequenceNumber: 'asc' },
        },
      },
    })
    if (!quote) return NextResponse.json({ error: 'הצעת מחיר לא נמצאה' }, { status: 404 })
    return NextResponse.json({ data: quote })
  } catch (error) {
    return NextResponse.json({ error: 'שגיאה בטעינת הצעת המחיר' }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const quote = await prisma.quote.update({ where: { id }, data: body })
    return NextResponse.json({ data: quote })
  } catch (error) {
    return NextResponse.json({ error: 'שגיאה בעדכון הצעת המחיר' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.quote.delete({ where: { id } })
    return NextResponse.json({ data: { success: true } })
  } catch (error) {
    return NextResponse.json({ error: 'שגיאה במחיקת הצעת המחיר' }, { status: 500 })
  }
}
