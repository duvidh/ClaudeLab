import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  console.log('🌱 מנקים וממלאים נתונים - גרסת "לילה לבן" סופית...')

  // ניקוי טבלאות (עם catch כדי שלא יקרוס אם הטבלה ריקה)
  await prisma.project.deleteMany({}).catch(() => {})
  await prisma.client.deleteMany({}).catch(() => {})
  await prisma.employee.deleteMany({}).catch(() => {})
  await prisma.lead.deleteMany({}).catch(() => {})
  await prisma.catalogItem.deleteMany({}).catch(() => {})

  // 1. קטלוג - רק שם ו-SKU
  await prisma.catalogItem.create({
    data: { sku: 'PRK-001', name: 'פרקט אלון טבעי', category: 'ריצוף', unit: 'מ"ר', salePrice: 180, selfCost: 110, supplier: 'ספק א' }
  })

  // 2. עובדים - רק שם ואימייל
  await prisma.employee.create({
    data: { name: 'דוד המנהל', email: 'manager@test.com', role: 'מנהל' }
  })

  // 3. לקוח ופרויקט - הכי בסיסי
  const client = await prisma.client.create({
    data: { name: 'לקוח בדיקה', email: 'client@test.com' }
  })

  await prisma.project.create({
    data: {
      name: 'פרויקט לדוגמה',
      status: 'In Progress',
      clientId: client.id
    }
  })

  // 4. לידים - רק שם
  await prisma.lead.create({
    data: { name: 'ליד חדש מהלילה', status: 'New' }
  })

  console.log('✅ הנס התרחש! המערכת מלאה. לילה טוב דוד!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
