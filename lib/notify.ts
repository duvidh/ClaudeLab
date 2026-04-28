import { prisma } from './prisma'

export async function notify(
  message: string,
  type: 'info' | 'success' | 'warning' | 'error' = 'info',
  relatedEntity?: string
) {
  try {
    await prisma.notification.create({ data: { message, type, relatedEntity: relatedEntity ?? null } })
  } catch {
    // notifications must never break the main flow
  }
}
