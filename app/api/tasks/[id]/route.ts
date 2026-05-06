import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { updateProjectProgress } from '@/lib/project-progress'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        lead: { select: { id: true, fullName: true } },
        client: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
        employee: { select: { id: true, name: true } },
      },
    })
    if (!task) return NextResponse.json({ error: 'משימה לא נמצאה' }, { status: 404 })
    return NextResponse.json({ data: task })
  } catch {
    return NextResponse.json({ error: 'שגיאה בטעינת המשימה' }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const { dueDate, ...rest } = body
    const data: Record<string, unknown> = { ...rest }
    if ('dueDate' in body) data.dueDate = dueDate ? new Date(dueDate) : null
    const task = await prisma.task.update({ where: { id }, data })
    if (task.projectId) await updateProjectProgress(task.projectId)
    return NextResponse.json({ data: task })
  } catch {
    return NextResponse.json({ error: 'שגיאה בעדכון המשימה' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const task = await prisma.task.findUnique({ where: { id }, select: { projectId: true } })
    await prisma.task.delete({ where: { id } })
    if (task?.projectId) await updateProjectProgress(task.projectId)
    return NextResponse.json({ data: { success: true } })
  } catch {
    return NextResponse.json({ error: 'שגיאה במחיקת המשימה' }, { status: 500 })
  }
}
