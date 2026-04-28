import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { LeadDetail } from '@/components/leads/LeadDetail'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function LeadDetailPage({ params }: PageProps) {
  const { id } = await params

  const lead = await prisma.lead.findUnique({
    where: { id },
    include: {
      notes: { orderBy: { createdAt: 'desc' } },
      meetings: { orderBy: { date: 'desc' } },
      files: true,
      tasks: { orderBy: { createdAt: 'desc' } },
      client: true,
    },
  })

  if (!lead) notFound()

  return (
    <div>
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-gray-500 mb-5">
        <Link href="/leads" className="hover:text-white transition-colors">
          לידים
        </Link>
        <ChevronRight size={14} />
        <span className="text-gray-300">{lead.fullName}</span>
      </nav>

      <LeadDetail lead={lead} />
    </div>
  )
}
