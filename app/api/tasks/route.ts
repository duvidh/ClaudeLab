import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { calculateAndUpdateProjectProgress } from '@/lib/project-progress'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const taskType = searchParams.get('taskType')
    const leadId = searchParams.get('leadId')
    const clientId = searchParams.get('clientId')
    const projectId = searchParams.get('projectId')

    const tasks = await prisma.task.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(priority ? { priority } : {}),
        ...(taskType ? { taskType } : {}),
        ...(leadId ? { leadId } : {}),
        ...(clientId ? { clientId } : {}),
        ...(projectId ? { projectId } : {}),
      },
      include: {
        lead: { select: { id: true, fullName: true } },
        client: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
        employee: { select: { id: true, name: true } },
      },
      orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }, { createdAt: 'desc' }],
    })
    return NextResponse.json({ data: tasks })
  } catch {
    return NextResponse.json({ error: 'שגיאה בטעינת המשימות' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { dueDate, ...rest } = body
    const task = await prisma.task.create({
      data: {
        ...rest,
        dueDate: dueDate ? new Date(dueDate) : undefined,
      },
      include: {
        employee: { select: { id: true, name: true } },
        lead: { select: { id: true, fullName: true } },
        client: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
      },
    })
    if (task.projectId) await calculateAndUpdateProjectProgress(task.projectId)
    return NextResponse.json({ data: task }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'שגיאה ביצירת המשימה' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, dueDate, ...data } = await req.json()
    const updateData: Record<string, unknown> = { ...data }
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null
    const task = await prisma.task.update({ where: { id }, data: updateData })
    if (task.projectId) await calculateAndUpdateProjectProgress(task.projectId)
    return NextResponse.json({ data: task })
  } catch {
    return NextResponse.json({ error: 'שגיאה בעדכון המשימה' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'חסר מזהה משימה' }, { status: 400 })
    const task = await prisma.task.findUnique({ where: { id }, select: { projectId: true } })
    await prisma.task.delete({ where: { id } })
    if (task?.projectId) await calculateAndUpdateProjectProgress(task.projectId)
    return NextResponse.json({ data: { success: true } })
  } catch {
    return NextResponse.json({ error: 'שגיאה במחיקת המשימה' }, { status: 500 })
  }
}
