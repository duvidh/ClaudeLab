import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  console.log('🌱 מנקים וממלאים נתונים (גרסה בטוחה)...')

  // ניקוי טבלאות
  await prisma.project.deleteMany({}).catch(() => {})
  await prisma.client.deleteMany({}).catch(() => {})
  await prisma.employee.deleteMany({}).catch(() => {})
  await prisma.lead.deleteMany({}).catch(() => {})
  await prisma.catalogItem.deleteMany({}).catch(() => {})

  // 1. קטלוג
  await prisma.catalogItem.createMany({
    data: [
      { sku: 'PRK-001', name: 'פרקט אלון טבעי', category: 'ריצוף', unit: 'מ"ר', salePrice: 180, selfCost: 110, supplier: 'פרקט בע"מ', stock: 200, isActive: true },
      { sku: 'TIL-002', name: 'אריחי גרניט 60x60', category: 'ריצוף', unit: 'מ"ר', salePrice: 140, selfCost: 82, supplier: 'קרמיקה ישראל', stock: 500, isActive: true }
    ]
  })

  // 2. עובדים (בלי שדה salary שהפיל אותנו)
  await prisma.employee.create({
    data: { name: 'דוד מנהל עבודה', role: 'מנהל פרויקטים', email: 'manager@example.com', phone: '050-0000000' }
  })

  // 3. לקוח ופרויקט
  const client = await prisma.client.create({
    data: { name: 'משפחת כהן', email: 'client1@test.com', phone: '054-9999999' }
  })

  await prisma.project.create({
    data: {
      name: 'שיפוץ פנטהאוז',
      status: 'In Progress',
      totalAmount: 250000,
      clientId: client.id
    }
  })

  // 4. לידים
  await prisma.lead.createMany({
    data: [
      { name: 'יוסי מזרחי', phone: '052-1111111', source: 'פייסבוק', status: 'New' },
      { name: 'רונית לוי', phone: '053-2222222', source: 'המלצה', status: 'Contacted' }
    ]
  })

  console.log('✅ הכל מוכן! המערכת מלאה.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
