import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const item = await prisma.catalogItem.update({ where: { id }, data: body })
    return NextResponse.json({ data: item })
  } catch (error) {
    return NextResponse.json({ error: 'שגיאה בעדכון הפריט' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.catalogItem.update({ where: { id }, data: { isActive: false } })
    return NextResponse.json({ data: { success: true } })
  } catch (error) {
    return NextResponse.json({ error: 'שגיאה בהסרת הפריט' }, { status: 500 })
  }
}
