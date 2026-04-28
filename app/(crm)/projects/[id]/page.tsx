import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { ProjectDetail } from '@/components/projects/ProjectDetail'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ProjectDetailPage({ params }: PageProps) {
  const { id } = await params

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      client: true,
      milestones: { orderBy: { order: 'asc' } },
      quotes: true,
      payments: { orderBy: { date: 'desc' } },
      tasks: { orderBy: { createdAt: 'desc' } },
      files: true,
    },
  })

  if (!project) notFound()

  return (
    <div>
      <nav className="flex items-center gap-1 text-sm text-gray-500 mb-5">
        <Link href="/projects" className="hover:text-white transition-colors">פרויקטים</Link>
        <ChevronRight size={14} />
        <Link href={`/clients/${project.clientId}`} className="hover:text-white transition-colors">{project.client.name}</Link>
        <ChevronRight size={14} />
        <span className="text-gray-300">{project.name}</span>
      </nav>
      <ProjectDetail project={project} />
    </div>
  )
}
