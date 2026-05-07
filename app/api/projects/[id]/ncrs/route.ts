import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { notify } from '@/lib/notify'
import { calculateAndUpdateProjectProgress } from '@/lib/project-progress'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const ncrs = await prisma.nCR.findMany({
      where: { projectId: id },
      include: {
        reportedBy: { select: { id: true, name: true } },
        resolvedBy: { select: { id: true, name: true } },
        qualityCheck: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ data: ncrs })
  } catch {
    return NextResponse.json({ error: 'שגיאה בטעינת דוחות אי-התאמה' }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const { title, description, severity, qualityCheckId, reportedById } = body
    const ncr = await prisma.nCR.create({
      data: {
        projectId: id,
        title,
        description,
        severity: severity ?? 'MEDIUM',
        status: 'OPEN',
        qualityCheckId: qualityCheckId ?? null,
        reportedById: reportedById ?? null,
      },
      include: {
        reportedBy: { select: { id: true, name: true } },
        resolvedBy: { select: { id: true, name: true } },
        qualityCheck: { select: { id: true, title: true } },
      },
    })
    await calculateAndUpdateProjectProgress(id)
    return NextResponse.json({ data: ncr }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'שגיאה ביצירת דוח אי-התאמה' }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const { id: ncrId, status, resolvedById } = body

    if (!ncrId || !status) {
      return NextResponse.json({ error: 'נדרשים מזהה דוח וסטטוס' }, { status: 400 })
    }

    const data: Record<string, unknown> = { status }
    if (resolvedById !== undefined) data.resolvedById = resolvedById
    if (status === 'RESOLVED') {
      data.resolvedAt = new Date()
      if (resolvedById !== undefined) data.resolvedById = resolvedById
    }

    const ncr = await prisma.nCR.update({
      where: { id: ncrId, projectId: id },
      data,
      include: {
        reportedBy: { select: { id: true, name: true } },
        resolvedBy: { select: { id: true, name: true } },
        qualityCheck: { select: { id: true, title: true } },
        project: { select: { name: true } },
      },
    })

    if (status === 'RESOLVED') {
      await notify(
        `דוח אי-התאמה "${ncr.title}" נסגר בפרויקט "${ncr.project.name}"`,
        'success',
        `project:${id}`
      )
    }
    await calculateAndUpdateProjectProgress(id)

    return NextResponse.json({ data: ncr })
  } catch {
    return NextResponse.json({ error: 'שגיאה בעדכון דוח אי-התאמה' }, { status: 500 })
  }
}
