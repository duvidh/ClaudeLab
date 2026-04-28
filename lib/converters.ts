import { prisma } from './prisma'

export async function convertLeadToClient(leadId: string) {
  return prisma.$transaction(async (tx) => {
    const lead = await tx.lead.findUniqueOrThrow({ where: { id: leadId } })

    if (lead.status === 'CONVERTED') {
      throw new Error('ליד זה כבר הומר ללקוח')
    }

    const client = await tx.client.create({
      data: {
        name: lead.fullName,
        address: lead.propertyAddress ?? undefined,
        city: lead.city ?? undefined,
        phones: JSON.stringify([lead.primaryPhone, lead.secondaryPhone].filter(Boolean)),
        email: lead.email ?? undefined,
        category: lead.clientType === 'BUSINESS' ? 'BUSINESS' : 'PRIVATE',
        status: 'ACTIVE',
        leadId: lead.id,
      },
    })

    await tx.lead.update({
      where: { id: leadId },
      data: { status: 'CONVERTED', convertedAt: new Date() },
    })

    await tx.task.create({
      data: {
        title: `פתיחת פרויקט ל${lead.fullName}`,
        description: 'ליד הומר ללקוח — יש לפתוח פרויקט חדש',
        priority: 'HIGH',
        status: 'PENDING',
        clientId: client.id,
      },
    })

    return client
  })
}
