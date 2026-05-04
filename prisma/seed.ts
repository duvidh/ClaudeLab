import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  console.log('🏗️ סיבוב ניצחון: זריעת נתונים עם השדות המדויקים...')

  // ניקוי
  await prisma.project.deleteMany({}).catch(() => {})
  await prisma.client.deleteMany({}).catch(() => {})
  await prisma.employee.deleteMany({}).catch(() => {})
  await prisma.lead.deleteMany({}).catch(() => {})
  await prisma.catalogItem.deleteMany({}).catch(() => {})

  // 1. עובדים - עבר קודם בהצלחה
  await prisma.employee.create({
    data: { name: 'דוד המנהל', email: 'manager@test.com', role: 'מנהל' }
  })

  // 2. לקוח ופרויקט - עבר קודם (נשאר רק עם שם ואימייל ליתר ביטחון)
  const client = await prisma.client.create({
    data: { name: 'לקוח VIP', email: 'vip@test.com' }
  })

  await prisma.project.create({
    data: {
      name: 'שיפוץ מרכז העיר',
      status: 'In Progress',
      clientId: client.id
    }
  })

  // 3. לידים - התיקון הקריטי לפי הלוגים של ורסל!
  await prisma.lead.create({
    data: { 
      fullName: 'ישראל ישראלי', // השם המדויק מהשגיאה
      primaryPhone: '050-1234567', // השם המדויק מהשגיאה
      status: 'New' 
    }
  })

  // 4. קטלוג
  await prisma.catalogItem.create({
    data: { 
      sku: 'PRK-777', 
      name: 'פרקט ניצחון', 
      category: 'ריצוף', 
      unit: 'מ"ר', 
      salePrice: 200, 
      selfCost: 100, 
      supplier: 'ספק לילה' 
    }
  })

  console.log('✅ הנס הושלם! המערכת מלאה ומוכנה.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
