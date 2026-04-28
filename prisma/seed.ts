import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Catalog items
  const catalog = await Promise.all([
    prisma.catalogItem.upsert({ where: { sku: 'PRK-001' }, update: {}, create: { sku: 'PRK-001', name: 'פרקט אלון טבעי 10 מ"מ', category: 'ריצוף', unit: 'מ"ר', salePrice: 180, selfCost: 110, supplier: 'פרקטל בע"מ', stock: 200, isActive: true } }),
    prisma.catalogItem.upsert({ where: { sku: 'TIL-002' }, update: {}, create: { sku: 'TIL-002', name: 'אריחי גרניט 60×60 לבן', category: 'ריצוף', unit: 'מ"ר', salePrice: 140, selfCost: 82, supplier: 'קרמיקה ישראל', stock: 500, isActive: true } }),
    prisma.catalogItem.upsert({ where: { sku: 'GYP-003' }, update: {}, create: { sku: 'GYP-003', name: 'גבס רגיל 12 מ"מ', category: 'גבס', unit: 'מ"ר', salePrice: 95, selfCost: 55, supplier: 'נירלט בע"מ', stock: 300, isActive: true } }),
    prisma.catalogItem.upsert({ where: { sku: 'PNT-004' }, update: {}, create: { sku: 'PNT-004', name: 'צבע לבן מאט פנים', category: 'צבע', unit: 'ליטר', salePrice: 65, selfCost: 38, supplier: 'כרזית', stock: 80, isActive: true } }),
    prisma.catalogItem.upsert({ where: { sku: 'PLB-005' }, update: {}, create: { sku: 'PLB-005', name: 'צינור PP גמיש ½"', category: 'אינסטלציה', unit: 'מ"ל', salePrice: 22, selfCost: 12, supplier: 'אינסט-ישראל', stock: 1000, isActive: true } }),
    prisma.catalogItem.upsert({ where: { sku: 'WIN-006' }, update: {}, create: { sku: 'WIN-006', name: 'חלון אלומיניום דו-כנפי 120×100', category: 'חלונות', unit: 'יחידה', salePrice: 1850, selfCost: 1100, supplier: 'אלו-ווינד', stock: 15, isActive: true } }),
    prisma.catalogItem.upsert({ where: { sku: 'ELC-007' }, update: {}, create: { sku: 'ELC-007', name: 'כבל NYY 3×2.5 מ"מ', category: 'חשמל', unit: 'מ"ל', salePrice: 18, selfCost: 10, supplier: 'חשמל ישראל', stock: 500, isActive: true } }),
  ])

  // Leads
  const lead1 = await prisma.lead.upsert({
    where: { id: 'seed-lead-001' },
    update: {},
    create: {
      id: 'seed-lead-001',
      fullName: 'דוד לוי',
      primaryPhone: '050-1234567',
      email: 'david.levi@gmail.com',
      propertyAddress: 'רחוב הרצל 45',
      city: 'תל אביב',
      clientType: 'PRIVATE',
      leadSource: 'GOOGLE',
      status: 'MEETING_SCHEDULED',
      workType: 'שיפוץ דירה',
      needDescription: 'שיפוץ מלא של דירת 4 חדרים — ריצוף, גבס, צבע, אינסטלציה',
      estimatedSize: 95,
      budget: 180000,
      urgency: 'HIGH',
      assignedRep: 'יוסי כהן',
      nextMeetingDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      notes: {
        create: [
          { content: 'לקוח רציני, מוכן להשקיע. שלחתי פרופיל חברה.', author: 'יוסי כהן', createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
          { content: 'שוחח על פגישה ראשונית לסיור בנכס', author: 'יוסי כהן', createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
        ]
      },
    }
  })

  const lead2 = await prisma.lead.upsert({
    where: { id: 'seed-lead-002' },
    update: {},
    create: {
      id: 'seed-lead-002',
      fullName: 'רחל אברהם',
      primaryPhone: '054-9876543',
      email: 'rachel.a@walla.co.il',
      city: 'רמת גן',
      clientType: 'PRIVATE',
      leadSource: 'REFERRAL',
      status: 'QUOTE_SENT',
      workType: 'ריצוף',
      estimatedSize: 60,
      budget: 50000,
      urgency: 'MEDIUM',
      assignedRep: 'מירי שלום',
    }
  })

  const lead3 = await prisma.lead.upsert({
    where: { id: 'seed-lead-003' },
    update: {},
    create: {
      id: 'seed-lead-003',
      fullName: 'בניין א.ב.ג בע"מ',
      primaryPhone: '03-5551234',
      email: 'office@abg-build.co.il',
      city: 'פתח תקוה',
      clientType: 'BUSINESS',
      leadSource: 'WEBSITE',
      status: 'NEW',
      workType: 'שיפוץ מסחרי',
      estimatedSize: 400,
      budget: 800000,
      urgency: 'LOW',
      assignedRep: 'יוסי כהן',
    }
  })

  const lead4 = await prisma.lead.upsert({
    where: { id: 'seed-lead-004' },
    update: {},
    create: {
      id: 'seed-lead-004',
      fullName: 'אמיר ומיה גולן',
      primaryPhone: '052-3334455',
      city: 'הרצליה',
      clientType: 'PRIVATE',
      leadSource: 'FACEBOOK',
      status: 'CONTACTED',
      workType: 'תוספת בנייה',
      estimatedSize: 40,
      urgency: 'MEDIUM',
    }
  })

  const lead5 = await prisma.lead.upsert({
    where: { id: 'seed-lead-005' },
    update: {},
    create: {
      id: 'seed-lead-005',
      fullName: 'נתן ספיר',
      primaryPhone: '058-7778899',
      city: 'חיפה',
      clientType: 'PRIVATE',
      leadSource: 'PHONE',
      status: 'WON',
      workType: 'שיפוץ דירה',
      estimatedSize: 75,
      urgency: 'HIGH',
      assignedRep: 'מירי שלום',
    }
  })

  // Clients (converted from leads or direct)
  const client1 = await prisma.client.upsert({
    where: { id: 'seed-client-001' },
    update: {},
    create: {
      id: 'seed-client-001',
      name: 'שמעון ורוזה כץ',
      address: 'שדרות רוטשילד 12',
      city: 'תל אביב',
      phones: JSON.stringify(['050-2223344', '03-6667788']),
      email: 'shimon.katz@gmail.com',
      category: 'PRIVATE',
      status: 'ACTIVE',
      paymentMethod: 'העברה בנקאית',
      notes: 'לקוחות ותיקים, שיפצו גם לפני 5 שנים',
    }
  })

  const client2 = await prisma.client.upsert({
    where: { id: 'seed-client-002' },
    update: {},
    create: {
      id: 'seed-client-002',
      name: 'קפה מרקט — רשת מסעדות',
      company: 'קפה מרקט בע"מ',
      idNumber: '514123456',
      address: 'אבן גבירול 55',
      city: 'תל אביב',
      phones: JSON.stringify(['03-9998877']),
      email: 'works@cafe-market.co.il',
      category: 'BUSINESS',
      status: 'ACTIVE',
      paymentMethod: "צ'ק",
    }
  })

  // Projects
  const project1 = await prisma.project.upsert({
    where: { id: 'seed-proj-001' },
    update: {},
    create: {
      id: 'seed-proj-001',
      name: 'שיפוץ דירת כץ',
      clientId: client1.id,
      address: 'שדרות רוטשילד 12, תל אביב',
      projectType: 'שיפוץ דירה',
      status: 'ACTIVE',
      projectManager: 'יוסי כהן',
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      plannedEndDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      progressPercent: 35,
      contractValue: 165000,
      notes: 'שיפוץ מלא 4 חדרים + מטבח',
      milestones: {
        create: [
          { name: 'פינוי ועבודות הריסה', status: 'DONE', plannedDate: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000), actualDate: new Date(Date.now() - 22 * 24 * 60 * 60 * 1000), order: 1 },
          { name: 'עבודות שלד וגבס', status: 'IN_PROGRESS', plannedDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), order: 2 },
          { name: 'ריצוף ואריחים', status: 'PENDING', plannedDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), order: 3 },
          { name: 'צבע וגימורים', status: 'PENDING', plannedDate: new Date(Date.now() + 50 * 24 * 60 * 60 * 1000), order: 4 },
        ]
      },
      payments: {
        create: [
          { clientId: client1.id, amount: 50000, method: 'העברה בנקאית', reference: 'TRF-20241101', notes: 'מקדמה ראשונה', date: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000) },
          { clientId: client1.id, amount: 40000, method: 'העברה בנקאית', reference: 'TRF-20241201', notes: 'תשלום שני', date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        ]
      }
    }
  })

  const project2 = await prisma.project.upsert({
    where: { id: 'seed-proj-002' },
    update: {},
    create: {
      id: 'seed-proj-002',
      name: 'שיפוץ סניף רוטשילד — קפה מרקט',
      clientId: client2.id,
      address: 'אבן גבירול 55, תל אביב',
      projectType: 'שיפוץ מסחרי',
      status: 'PLANNING',
      projectManager: 'מירי שלום',
      startDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      plannedEndDate: new Date(Date.now() + 75 * 24 * 60 * 60 * 1000),
      progressPercent: 0,
      contractValue: 320000,
      milestones: {
        create: [
          { name: 'אישורים ותכנון', status: 'IN_PROGRESS', plannedDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), order: 1 },
          { name: 'עבודות בנייה ראשיות', status: 'PENDING', plannedDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), order: 2 },
          { name: 'חשמל ואינסטלציה', status: 'PENDING', plannedDate: new Date(Date.now() + 55 * 24 * 60 * 60 * 1000), order: 3 },
          { name: 'גימורים ומסירה', status: 'PENDING', plannedDate: new Date(Date.now() + 72 * 24 * 60 * 60 * 1000), order: 4 },
        ]
      },
    }
  })

  // Quotes
  const quote1 = await prisma.quote.upsert({
    where: { quoteNumber: 'Q-2024-001' },
    update: {},
    create: {
      quoteNumber: 'Q-2024-001',
      clientId: client1.id,
      projectId: project1.id,
      date: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000),
      validUntil: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
      status: 'APPROVED',
      version: 2,
      discount: 5000,
      paymentTerms: '30% מקדמה, 40% אמצע עבודה, 30% סיום',
      items: {
        create: [
          { sequenceNumber: 1, productName: 'פרקט אלון טבעי', dimension1: 95, dimension2: 1, unit: 'מ"ר', unitPrice: 180, materialsCost: 10450, transportCost: 800, laborCost: 4750, catalogItemId: catalog[0].id },
          { sequenceNumber: 2, productName: 'אריחי גרניט שירותים וחדרי אמבטיה', dimension1: 18, dimension2: 1, unit: 'מ"ר', unitPrice: 140, materialsCost: 1476, transportCost: 200, laborCost: 900 },
          { sequenceNumber: 3, productName: 'עבודות גבס — תקרות וקירות', dimension1: 120, dimension2: 1, unit: 'מ"ר', unitPrice: 95, materialsCost: 6600, transportCost: 400, laborCost: 5000 },
          { sequenceNumber: 4, productName: 'צבע פנים מלא', dimension1: 280, dimension2: 1, unit: 'מ"ר', unitPrice: 45, materialsCost: 2520, transportCost: 200, laborCost: 3300 },
        ]
      }
    }
  })

  const quote2 = await prisma.quote.upsert({
    where: { quoteNumber: 'Q-2024-002' },
    update: {},
    create: {
      quoteNumber: 'Q-2024-002',
      clientId: client2.id,
      projectId: project2.id,
      date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      validUntil: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
      status: 'SENT',
      version: 1,
      discount: 15000,
      paymentTerms: '25% חתימה, 35% אמצע, 40% מסירה',
      items: {
        create: [
          { sequenceNumber: 1, productName: 'אריחי גרניט 60×60 כל השטח', dimension1: 200, dimension2: 1, unit: 'מ"ר', unitPrice: 140, materialsCost: 16400, transportCost: 2000, laborCost: 8000, catalogItemId: catalog[1].id },
          { sequenceNumber: 2, productName: 'עבודות גבס ותקרות', dimension1: 200, dimension2: 1, unit: 'מ"ר', unitPrice: 110, materialsCost: 11000, transportCost: 1500, laborCost: 9000 },
          { sequenceNumber: 3, productName: 'חלונות אלומיניום', dimension1: 8, dimension2: 1, unit: 'יחידה', unitPrice: 1850, materialsCost: 8800, transportCost: 800, laborCost: 2400, catalogItemId: catalog[5].id },
          { sequenceNumber: 4, productName: 'עבודות חשמל', dimension1: 1, dimension2: 1, unit: 'עבודה', unitPrice: 45000, materialsCost: 22000, transportCost: 500, laborCost: 20000 },
        ]
      }
    }
  })

  // Tasks
  const tasks = await Promise.all([
    prisma.task.create({ data: { title: 'להכין הצעת מחיר לבניין א.ב.ג', description: 'לפרט עבודות שיפוץ 400 מ"ר משרדים', priority: 'HIGH', status: 'PENDING', dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), assignedTo: 'יוסי כהן', leadId: lead3.id } }),
    prisma.task.create({ data: { title: 'רכש חומרים — פרויקט כץ', description: 'להזמין פרקט וצבע לפי כמויות הצעת מחיר', priority: 'HIGH', status: 'IN_PROGRESS', dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), assignedTo: 'יוסי כהן', projectId: project1.id, clientId: client1.id } }),
    prisma.task.create({ data: { title: 'מעקב אחר הצעת מחיר — קפה מרקט', priority: 'MEDIUM', status: 'PENDING', dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), assignedTo: 'מירי שלום', clientId: client2.id, projectId: project2.id } }),
    prisma.task.create({ data: { title: 'פגישת תכנון עם מעצב פנים', priority: 'MEDIUM', status: 'PENDING', dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), clientId: client1.id, projectId: project1.id } }),
    prisma.task.create({ data: { title: 'חידוש רישיון קבלן', priority: 'HIGH', status: 'PENDING', dueDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), assignedTo: 'מירי שלום' } }),
    prisma.task.create({ data: { title: 'לשלוח חוזה מעודכן ללקוח כץ', priority: 'LOW', status: 'DONE', clientId: client1.id } }),
  ])

  // Meetings
  await Promise.all([
    prisma.meeting.create({ data: { leadId: lead1.id, type: 'פגישה', date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), summary: 'סיור בנכס, הסכמה על היקף עבודה. הלקוח מוכן להתחיל בחודש הבא.' } }),
    prisma.meeting.create({ data: { leadId: lead1.id, type: 'שיחה', date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), summary: 'שיחה ראשונית — הבנת צרכים.' } }),
    prisma.meeting.create({ data: { clientId: client2.id, type: 'פגישה', date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), summary: 'הצגת תכניות הסניף, אישור לוחות זמנים.' } }),
  ])

  // Notifications
  await Promise.all([
    prisma.notification.create({ data: { message: 'משימה "חידוש רישיון קבלן" עברה את תאריך היעד', type: 'warning', isRead: false } }),
    prisma.notification.create({ data: { message: 'הצעת מחיר Q-2024-001 אושרה על ידי לקוח כץ', type: 'success', isRead: false } }),
    prisma.notification.create({ data: { message: 'פרויקט "שיפוץ דירת כץ" הגיע ל-35% התקדמות', type: 'info', isRead: true } }),
    prisma.notification.create({ data: { message: 'משימת "רכש חומרים — פרויקט כץ" באיחור של יום', type: 'error', isRead: false } }),
  ])

  console.log('✅ Seed complete')
  console.log(`   ${7} catalog items`)
  console.log(`   ${5} leads`)
  console.log(`   ${2} clients`)
  console.log(`   ${2} projects (with milestones + payments)`)
  console.log(`   ${2} quotes (with items)`)
  console.log(`   ${6} tasks`)
  console.log(`   ${3} meetings`)
  console.log(`   ${4} notifications`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
