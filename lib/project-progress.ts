import { prisma } from '@/lib/prisma'

export async function calculateAndUpdateProjectProgress(projectId: string): Promise<void> {
  try {
    const [tasks, milestones, changeRequests, openNcrs] = await Promise.all([
      prisma.task.findMany({ where: { projectId }, select: { status: true } }),
      prisma.milestone.findMany({ where: { projectId }, select: { status: true } }),
      prisma.changeRequest.findMany({
        where: { projectId, status: 'APPROVED' },
        select: { isCompleted: true },
      }),
      prisma.nCR.count({
        where: { projectId, status: { in: ['OPEN', 'IN_PROGRESS'] } },
      }),
    ])

    const baseTotal = tasks.length + milestones.length
    const baseCompleted =
      tasks.filter((t) => t.status === 'DONE').length +
      milestones.filter((m) => m.status === 'DONE').length

    const crTotal = changeRequests.length
    const crCompleted = changeRequests.filter((cr) => cr.isCompleted).length

    const totalScope = baseTotal + crTotal
    const totalDone = baseCompleted + crCompleted

    const rawPercentage = totalScope > 0 ? Math.round((totalDone / totalScope) * 100) : 0
    const penalty = openNcrs * 5
    const finalProgress = Math.max(0, Math.min(100, rawPercentage - penalty))

    await prisma.project.update({
      where: { id: projectId },
      data: { progressPercent: finalProgress },
    })
  } catch {
    // silently swallow — never breaks the main flow
  }
}
