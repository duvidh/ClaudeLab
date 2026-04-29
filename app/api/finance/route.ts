import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const [payments, projects, clients] = await Promise.all([
      prisma.payment.findMany({
        include: {
          project: { select: { name: true, contractValue: true, clientId: true } },
        },
        orderBy: { date: 'desc' },
      }),
      prisma.project.findMany({
        select: { contractValue: true, status: true },
      }),
      prisma.client.findMany({
        select: {
          id: true,
          name: true,
          projects: { select: { payments: { select: { amount: true } } } },
        },
      }),
    ])

    const totalRevenue = payments.reduce((s, p) => s + p.amount, 0)
    const totalContracts = projects.reduce((s, p) => s + p.contractValue, 0)
    const outstanding = Math.max(0, totalContracts - totalRevenue)
    const activeProjects = projects.filter((p) => p.status === 'ACTIVE').length

    // Monthly breakdown — last 12 months
    const now = new Date()
    const monthlyData: { month: string; amount: number }[] = []
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const label = d.toLocaleDateString('he-IL', { month: 'short', year: '2-digit' })
      const amount = payments
        .filter((p) => {
          const pd = new Date(p.date)
          return pd.getFullYear() === d.getFullYear() && pd.getMonth() === d.getMonth()
        })
        .reduce((s, p) => s + p.amount, 0)
      monthlyData.push({ month: label, amount })
    }

    // YTD revenue
    const ytdStart = new Date(now.getFullYear(), 0, 1)
    const ytdRevenue = payments
      .filter((p) => new Date(p.date) >= ytdStart)
      .reduce((s, p) => s + p.amount, 0)

    // Recent 10 payments
    const recentPayments = payments.slice(0, 10).map((p) => ({
      id: p.id,
      amount: p.amount,
      date: p.date,
      method: p.method,
      reference: p.reference,
      projectName: p.project?.name ?? '',
      clientId: p.project?.clientId ?? p.clientId ?? '',
    }))

    // Top 5 clients by total paid
    const topClients = clients
      .map((c) => ({
        id: c.id,
        name: c.name,
        totalPaid: c.projects.flatMap((pr) => pr.payments).reduce((s, p) => s + p.amount, 0),
      }))
      .filter((c) => c.totalPaid > 0)
      .sort((a, b) => b.totalPaid - a.totalPaid)
      .slice(0, 5)

    return NextResponse.json({
      data: {
        totalRevenue,
        totalContracts,
        outstanding,
        activeProjects,
        ytdRevenue,
        monthlyData,
        recentPayments,
        topClients,
      },
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'שגיאה בטעינת נתונים פיננסיים' }, { status: 500 })
  }
}
