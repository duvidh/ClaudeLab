import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { notify } from '@/lib/notify'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const changeRequests = await prisma.changeRequest.findMany({
      where: { projectId: id },
      include: {
        requestedBy: { select: { id: true, name: true } },
        approvedBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ data: changeRequests })
  } catch {
    return NextResponse.json({ error: 'שגיאה בטעינת בקשות השינוי' }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const { title, description, costImpact, timeImpact, requestedById } = body
    const changeRequest = await prisma.changeRequest.create({
      data: {
        projectId: id,
        title,
        description,
        costImpact: costImpact ?? 0,
        timeImpact: timeImpact ?? 0,
        status: 'PENDING',
        requestedById: requestedById ?? null,
      },
      include: {
        requestedBy: { select: { id: true, name: true } },
        approvedBy: { select: { id: true, name: true } },
      },
    })
    return NextResponse.json({ data: changeRequest }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'שגיאה ביצירת בקשת שינוי' }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const { id: changeRequestId, action, approvedById } = body

    if (!changeRequestId || !action) {
      return NextResponse.json({ error: 'נדרשים מזהה בקשה ופעולה' }, { status: 400 })
    }
    if (action !== 'APPROVE' && action !== 'REJECT') {
      return NextResponse.json({ error: 'פעולה לא חוקית — השתמש ב-APPROVE או REJECT' }, { status: 400 })
    }

    // Check if approver has an eligible role in ProjectMember table.
    // If no ProjectMember rows exist for this project, allow through.
    if (approvedById) {
      const memberCount = await prisma.projectMember.count({ where: { projectId: id } })
      if (memberCount > 0) {
        const eligibleMember = await prisma.projectMember.findFirst({
          where: {
            projectId: id,
            employeeId: approvedById,
            role: { in: ['OWNER_REP', 'PROJECT_MANAGER'] },
          },
        })
        if (!eligibleMember) {
          return NextResponse.json(
            { error: 'אין הרשאה לאשר בקשת שינוי — נדרשת תפקיד מנהל פרויקט או נציג בעלים' },
            { status: 403 }
          )
        }
      }
    }

    const newStatus = action === 'APPROVE' ? 'APPROVED' : 'REJECTED'
    const changeRequest = await prisma.changeRequest.update({
      where: { id: changeRequestId, projectId: id },
      data: {
        status: newStatus,
        approvedById: approvedById ?? null,
        approvedAt: action === 'APPROVE' ? new Date() : null,
      },
      include: {
        requestedBy: { select: { id: true, name: true } },
        approvedBy: { select: { id: true, name: true } },
        project: { select: { name: true } },
      },
    })

    await notify(
      `בקשת שינוי "${changeRequest.title}" ${action === 'APPROVE' ? 'אושרה' : 'נדחתה'} בפרויקט "${changeRequest.project.name}"`,
      action === 'APPROVE' ? 'success' : 'warning',
      `project:${id}`
    )

    return NextResponse.json({ data: changeRequest })
  } catch {
    return NextResponse.json({ error: 'שגיאה בעדכון בקשת שינוי' }, { status: 500 })
  }
}
