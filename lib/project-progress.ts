import { prisma } from '@/lib/prisma'

export async function updateProjectProgress(projectId: string): Promise<void> {
  try {
    const [tasks, milestones, workPackages] = await Promise.all([
      prisma.task.findMany({ where: { projectId }, select: { status: true } }),
      prisma.milestone.findMany({ where: { projectId }, select: { status: true } }),
      prisma.workPackage.findMany({
        where: { projectId, status: { not: 'CANCELLED' } },
        select: { status: true },
      }),
    ])

    const total = tasks.length + milestones.length + workPackages.length
    if (total === 0) return

    const completed =
      tasks.filter((t) => t.status === 'DONE').length +
      milestones.filter((m) => m.status === 'DONE').length +
      workPackages.filter((w) => w.status === 'COMPLETED').length

    await prisma.project.update({
      where: { id: projectId },
      data: { progressPercent: Math.round((completed / total) * 100) },
    })
  } catch {
    // silently swallow — never breaks the main flow
  }
}
