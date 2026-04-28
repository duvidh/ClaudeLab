import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const q = new URL(req.url).searchParams.get('q')?.trim()
    if (!q || q.length < 2) return NextResponse.json({ data: [] })

    const [leads, clients, projects] = await Promise.all([
      prisma.lead.findMany({
        where: {
          OR: [
            { fullName: { contains: q } },
            { primaryPhone: { contains: q } },
            { email: { contains: q } },
            { city: { contains: q } },
          ],
        },
        select: { id: true, fullName: true, status: true, primaryPhone: true },
        take: 5,
      }),
      prisma.client.findMany({
        where: {
          OR: [
            { name: { contains: q } },
            { company: { contains: q } },
            { email: { contains: q } },
            { city: { contains: q } },
          ],
        },
        select: { id: true, name: true, city: true, status: true },
        take: 5,
      }),
      prisma.project.findMany({
        where: {
          OR: [
            { name: { contains: q } },
            { address: { contains: q } },
            { projectManager: { contains: q } },
          ],
        },
        select: { id: true, name: true, status: true, client: { select: { name: true } } },
        take: 5,
      }),
    ])

    const results = [
      ...leads.map((l) => ({ type: 'lead' as const, id: l.id, label: l.fullName, sub: l.primaryPhone, status: l.status, href: `/leads/${l.id}` })),
      ...clients.map((c) => ({ type: 'client' as const, id: c.id, label: c.name, sub: c.city ?? '', status: c.status, href: `/clients/${c.id}` })),
      ...projects.map((p) => ({ type: 'project' as const, id: p.id, label: p.name, sub: p.client.name, status: p.status, href: `/projects/${p.id}` })),
    ]

    return NextResponse.json({ data: results })
  } catch (error) {
    return NextResponse.json({ error: 'שגיאה בחיפוש' }, { status: 500 })
  }
}
