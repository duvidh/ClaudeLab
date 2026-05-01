import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)

    const [
      leadsByStatus,
      totalLeads,
      activeProjects,
      pendingTasks,
      overdueTasks,
      upcomingTasks,
      paymentsThisMonth,
      paymentsLast6Months,
      recentLeads,
    ] = await Promise.all([
      // Lead counts grouped by status
      prisma.lead.groupBy({ by: ['status'], where: { deletedAt: null }, _count: { id: true } }),
      // Total leads
      prisma.lead.count({ where: { deletedAt: null } }),
      // Active projects with contract values
      prisma.project.findMany({
        where: { status: { in: ['PLANNING', 'ACTIVE', 'PAUSED'] } },
        select: { id: true, name: true, status: true, contractValue: true, progressPercent: true, client: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      // All non-done tasks
      prisma.task.count({ where: { status: { not: 'DONE' } } }),
      // Overdue tasks
      prisma.task.count({
        where: { status: { not: 'DONE' }, dueDate: { lt: now } },
      }),
      // Upcoming tasks due within 7 days
      prisma.task.findMany({
        where: {
          status: { not: 'DONE' },
          dueDate: { gte: now, lte: in7Days },
        },
        include: {
          client: { select: { name: true } },
          project: { select: { name: true } },
        },
        orderBy: { dueDate: 'asc' },
        take: 5,
      }),
      // Payments received this month
      prisma.payment.aggregate({
        where: { date: { gte: startOfMonth, lte: endOfMonth } },
        _sum: { amount: true },
        _count: { id: true },
      }),
      // Payments last 6 months (for chart)
      prisma.payment.findMany({
        where: { date: { gte: sixMonthsAgo } },
        select: { amount: true, date: true },
      }),
      // 5 most recent leads
      prisma.lead.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          fullName: true,
          status: true,
          primaryPhone: true,
          city: true,
          createdAt: true,
        },
      }),
    ])

    const activeProjectCount = activeProjects.length
    const totalContractValue = activeProjects.reduce((s, p) => s + (p.contractValue ?? 0), 0)
    const revenueThisMonth = paymentsThisMonth._sum.amount ?? 0

    const HE_MONTHS = ['ינו', 'פבר', 'מרץ', 'אפר', 'מאי', 'יונ', 'יול', 'אוג', 'ספט', 'אוק', 'נוב', 'דצמ']
    const monthlyRevenue: { month: string; amount: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const total = paymentsLast6Months
        .filter((p) => {
          const pd = new Date(p.date)
          return pd.getFullYear() === d.getFullYear() && pd.getMonth() === d.getMonth()
        })
        .reduce((s, p) => s + p.amount, 0)
      monthlyRevenue.push({ month: HE_MONTHS[d.getMonth()], amount: total })
    }

    return NextResponse.json({
      data: {
        leads: {
          total: totalLeads,
          byStatus: Object.fromEntries(
            leadsByStatus.map((g) => [g.status, g._count.id])
          ),
        },
        projects: {
          active: activeProjectCount,
          totalContractValue,
          recent: activeProjects,
        },
        tasks: {
          pending: pendingTasks,
          overdue: overdueTasks,
          upcoming: upcomingTasks,
        },
        revenue: {
          thisMonth: revenueThisMonth,
          paymentCount: paymentsThisMonth._count.id,
          monthly: monthlyRevenue,
        },
        recentLeads,
      },
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'שגיאה בטעינת הדשבורד' }, { status: 500 })
  }
}
