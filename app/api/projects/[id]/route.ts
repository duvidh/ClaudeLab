import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        client: true,
        milestones: { orderBy: { order: 'asc' } },
        quotes: { include: { items: true } },
        payments: { orderBy: { date: 'desc' } },
        tasks: { orderBy: { createdAt: 'desc' } },
        files: true,
      },
    })
    if (!project) return NextResponse.json({ error: 'פרויקט לא נמצא' }, { status: 404 })
    return NextResponse.json({ data: project })
  } catch (error) {
    return NextResponse.json({ error: 'שגיאה בטעינת הפרויקט' }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const data: Record<string, unknown> = { ...body }
    // Auto-set actualEndDate when project is marked COMPLETED
    if (data.status === 'COMPLETED' && !data.actualEndDate) {
      data.actualEndDate = new Date()
    }
    const project = await prisma.project.update({ where: { id }, data })
    return NextResponse.json({ data: project })
  } catch (error) {
    return NextResponse.json({ error: 'שגיאה בעדכון הפרויקט' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.project.delete({ where: { id } })
    return NextResponse.json({ data: { success: true } })
  } catch (error) {
    return NextResponse.json({ error: 'שגיאה במחיקת הפרויקט' }, { status: 500 })
  }
}
