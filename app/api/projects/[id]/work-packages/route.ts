import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { updateProjectProgress } from '@/lib/project-progress'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const workPackages = await prisma.workPackage.findMany({
      where: { projectId: id },
      include: {
        assignee: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'asc' },
    })
    return NextResponse.json({ data: workPackages })
  } catch {
    return NextResponse.json({ error: 'שגיאה בטעינת חבילות העבודה' }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const { name, description, startDate, endDate, budget, status, assigneeId } = body
    if (!name) {
      return NextResponse.json({ error: 'שם חבילת עבודה חובה' }, { status: 400 })
    }
    const workPackage = await prisma.workPackage.create({
      data: {
        projectId: id,
        name,
        description: description ?? null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        budget: budget ?? 0,
        status: status ?? 'PLANNED',
        assigneeId: assigneeId ?? null,
      },
      include: {
        assignee: { select: { id: true, name: true } },
      },
    })
    await updateProjectProgress(id)
    return NextResponse.json({ data: workPackage }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'שגיאה ביצירת חבילת עבודה' }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const { id: wpId, name, description, startDate, endDate, budget, status, assigneeId } = body
    if (!wpId) {
      return NextResponse.json({ error: 'נדרש מזהה חבילת עבודה' }, { status: 400 })
    }
    const data: Record<string, unknown> = {}
    if (name !== undefined) data.name = name
    if (description !== undefined) data.description = description
    if (startDate !== undefined) data.startDate = startDate ? new Date(startDate) : null
    if (endDate !== undefined) data.endDate = endDate ? new Date(endDate) : null
    if (budget !== undefined) data.budget = budget
    if (status !== undefined) data.status = status
    if (assigneeId !== undefined) data.assigneeId = assigneeId

    const workPackage = await prisma.workPackage.update({
      where: { id: wpId, projectId: id },
      data,
      include: {
        assignee: { select: { id: true, name: true } },
      },
    })
    await updateProjectProgress(id)
    return NextResponse.json({ data: workPackage })
  } catch {
    return NextResponse.json({ error: 'שגיאה בעדכון חבילת העבודה' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(req.url)
    const wpId = searchParams.get('wpId')
    if (!wpId) {
      return NextResponse.json({ error: 'נדרש מזהה חבילת עבודה' }, { status: 400 })
    }
    await prisma.workPackage.delete({ where: { id: wpId, projectId: id } })
    await updateProjectProgress(id)
    return NextResponse.json({ data: { success: true } })
  } catch {
    return NextResponse.json({ error: 'שגיאה במחיקת חבילת העבודה' }, { status: 500 })
  }
}
