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

    // Form inputs send Float fields as strings — coerce before Prisma
    const data: Record<string, unknown> = { ...body }
    if ('estimatedSize' in data) {
      const v = data.estimatedSize
      data.estimatedSize = v !== '' && v != null ? parseFloat(String(v)) : null
    }
    if ('budget' in data) {
      const v = data.budget
      data.budget = v !== '' && v != null ? parseFloat(String(v)) : null
    }

    const lead = await prisma.lead.update({ where: { id }, data })
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
    await (prisma.lead as any).update({ where: { id }, data: { deletedAt: new Date() } })
    return NextResponse.json({ data: { success: true } })
  } catch (error) {
    return NextResponse.json({ error: 'שגיאה במחיקת הליד' }, { status: 500 })
  }
}
