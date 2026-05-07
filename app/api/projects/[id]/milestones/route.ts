import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { notify } from '@/lib/notify'
import { calculateAndUpdateProjectProgress } from '@/lib/project-progress'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const count = await prisma.milestone.count({ where: { projectId: id } })
    const milestone = await prisma.milestone.create({
      data: { ...body, projectId: id, order: count },
    })
    await calculateAndUpdateProjectProgress(id)
    return NextResponse.json({ data: milestone }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'שגיאה ביצירת אבן דרך' }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params
    const { milestoneId, ...data } = await req.json()
    const milestone = await prisma.milestone.update({
      where: { id: milestoneId, projectId },
      data,
      include: { project: { select: { name: true } } },
    })
    if (data.status === 'DONE') {
      await notify(
        `אבן דרך "${milestone.name}" הושלמה בפרויקט "${milestone.project.name}"`,
        'success',
        `project:${projectId}`
      )
    }
    await calculateAndUpdateProjectProgress(projectId)
    return NextResponse.json({ data: milestone })
  } catch {
    return NextResponse.json({ error: 'שגיאה בעדכון אבן דרך' }, { status: 500 })
  }
}
