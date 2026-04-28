import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { calcClientFinancials } from '@/lib/calculations'
import { ClientDetail } from '@/components/clients/ClientDetail'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ClientDetailPage({ params }: PageProps) {
  const { id } = await params

  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      lead: true,
      projects: {
        include: { payments: true, milestones: true },
        orderBy: { createdAt: 'desc' },
      },
      quotes: {
        include: { project: true },
        orderBy: { createdAt: 'desc' },
      },
      invoices: { orderBy: { date: 'desc' } },
      meetings: { orderBy: { date: 'desc' } },
      tasks: { orderBy: { createdAt: 'desc' } },
      files: { orderBy: { createdAt: 'desc' } },
    },
  })

  if (!client) notFound()

  const allPayments = client.projects.flatMap((p) => p.payments)
  const financials = calcClientFinancials(
    client.projects.map((p) => p.contractValue),
    allPayments.map((p) => p.amount)
  )

  return (
    <div>
      <nav className="flex items-center gap-1 text-sm text-gray-500 mb-5">
        <Link href="/clients" className="hover:text-white transition-colors">
          לקוחות
        </Link>
        <ChevronRight size={14} />
        <span className="text-gray-300">{client.name}</span>
      </nav>

      <ClientDetail client={{ ...client, financials }} />
    </div>
  )
}
