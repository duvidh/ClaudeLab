import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const lead = await prisma.lead.findUnique({
      where: { id },
      include: {
        notes: { orderBy: { createdAt: 'desc' } },
        meetings: { orderBy: { date: 'desc' } },
        files: true,
        tasks: { orderBy: { createdAt: 'desc' } },
        client: true,
      },
    })
    if (!lead) return NextResponse.json({ error: 'ליד לא נמצא' }, { status: 404 })
    return NextResponse.json({ data: lead })
  } catch (error) {
    return NextResponse.json({ error: 'שגיאה בטעינת הליד' }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const lead = await prisma.lead.update({ where: { id }, data: body })
    return NextResponse.json({ data: lead })
  } catch (error) {
    return NextResponse.json({ error: 'שגיאה בעדכון הליד' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.lead.delete({ where: { id } })
    return NextResponse.json({ data: { success: true } })
  } catch (error) {
    return NextResponse.json({ error: 'שגיאה במחיקת הליד' }, { status: 500 })
  }
}
