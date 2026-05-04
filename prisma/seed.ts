import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  console.log('🌱 מתחילים לזרוע נתונים בכל הלשוניות...')

  // 1. קטלוג מוצרים (מה שהיה לך, משופר)
  await Promise.all([
    prisma.catalogItem.upsert({
      where: { sku: 'PRK-001' },
      update: {},
      create: { sku: 'PRK-001', name: 'פרקט אלון טבעי 10 מ"מ', category: 'ריצוף', unit: 'מ"ר', salePrice: 180, selfCost: 110, supplier: 'פרקט בע"מ', stock: 200, isActive: true }
    }),
    prisma.catalogItem.upsert({
      where: { sku: 'TIL-002' },
      update: {},
      create: { sku: 'TIL-002', name: 'אריחי גרניט 60x60 לבן', category: 'ריצוף', unit: 'מ"ר', salePrice: 140, selfCost: 82, supplier: 'קרמיקה ישראל', stock: 500, isActive: true }
    })
  ])

  // 2. עובדים
  await prisma.employee.upsert({
    where: { email: 'manager@example.com' },
    update: {},
    create: { name: 'דוד מנהל עבודה', role: 'מנהל פרויקטים', email: 'manager@example.com', phone: '050-0000000', salary: 15000 }
  })

  // 3. לקוחות ופרויקטים (חשוב: פרויקט חייב לקוח)
  const client = await prisma.client.upsert({
    where: { email: 'client1@test.com' },
    update: {},
    create: { name: 'משפחת כהן', email: 'client1@test.com', phone: '054-9999999', address: 'רוטשילד 10, תל אביב' }
  })

  await prisma.project.create({
    data: {
      name: 'שיפוץ פנטהאוז - רוטשילד',
      status: 'In Progress',
      totalAmount: 250000,
      clientId: client.id
    }
  })

  // 4. לידים (הלשונית שהייתה ריקה)
  await prisma.lead.createMany({
    data: [
      { name: 'יוסי מזרחי', phone: '052-1111111', source: 'פייסבוק', status: 'New', notes: 'מעוניין בשיפוץ אמבטיה' },
      { name: 'רונית לוי', phone: '053-2222222', source: 'המלצה', status: 'Contacted', notes: 'צריכה הצעה לריצוף חוץ' }
    ]
  })

  // 5. משימות (Tasks)
  await prisma.task.create({
    data: {
      title: 'הזמנת חומרים לשלב א׳',
      description: 'להזמין קרמיקה ודבק לפי הכמויות בתוכנית',
      status: 'Todo',
      priority: 'High'
    }
  })

  console.log('✅ המערכת מלאה! כל הלשוניות עודכנו.')
}

main()
  .catch((e) => {
    console.error('❌ שגיאה בזריעת נתונים:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
