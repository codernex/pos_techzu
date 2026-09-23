import { Prisma, PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load .env if present
const candidatePaths = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(__dirname, '../../../.env'),
  path.resolve(__dirname, '../.env'),
  path.resolve(__dirname, '.env'),
];

for (const p of candidatePaths) {
  if (fs.existsSync(p)) {
    dotenv.config({ path: p });
    break;
  }
}
dotenv.config();

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://postgres:postgrespassword@localhost:5433/pos_db?schema=public';

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Checking database status for seeding...');

  const companyCount = await prisma.company.count();
  if (companyCount > 0 && process.env.FORCE_SEED !== 'true') {
    console.log('Database already seeded with company data. Skipping seed to preserve existing records.');
    console.log('(Set FORCE_SEED=true if you wish to reset and re-seed the database)');
    return;
  }

  console.log('Seeding POS Techzu database with Bangladeshi locations and BDT currency...');

  // Clean existing data in dependency order
  await prisma.saleItem.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.outletMenuItem.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.category.deleteMany();
  await prisma.outlet.deleteMany();
  await prisma.company.deleteMany();

  // 1. Create Company
  const company = await prisma.company.create({
    data: {
      name: 'Techzu Ichicode',
      code: 'TECHZU',
    },
  });
  console.log(`Created Company: ${company.name}`);

  // 2. Create Outlets with Bangladeshi Locations
  const outlets = await Promise.all([
    prisma.outlet.create({
      data: {
        companyId: company.id,
        name: 'Gulshan-2 Flagship',
        code: 'GLS',
        address: 'House 12, Road 11, Block D, Gulshan-2, Dhaka 1212',
        phone: '+880 1711-001101',
      },
    }),
    prisma.outlet.create({
      data: {
        companyId: company.id,
        name: 'Dhanmondi Branch',
        code: 'DHN',
        address: 'Plot 42, Satmasjid Road, Dhanmondi, Dhaka 1209',
        phone: '+880 1819-001102',
      },
    }),
    prisma.outlet.create({
      data: {
        companyId: company.id,
        name: 'Uttara Hub',
        code: 'UTR',
        address: 'Sector 3, Jashimuddin Avenue, Uttara, Dhaka 1230',
        phone: '+880 1912-001103',
      },
    }),
  ]);
  console.log(`Created ${outlets.length} Bangladeshi Outlets`);

  const [gulshan, dhanmondi, uttara] = outlets;

  // 3. Create Categories
  const categories = await Promise.all([
    prisma.category.create({ data: { name: 'Hot Beverages', description: 'Freshly brewed artisan coffees and authentic spiced teas' } }),
    prisma.category.create({ data: { name: 'Cold Beverages & Refreshers', description: 'Iced coffees, cold brews, and seasonal refreshers' } }),
    prisma.category.create({ data: { name: 'Bakery & Sweets', description: 'Freshly baked croissants, pastries, and artisanal muffins' } }),
    prisma.category.create({ data: { name: 'Kitchen & Local Special', description: 'Signature gourmet burgers, local delicacies, and hot meals' } }),
  ]);
  console.log(`Created ${categories.length} Categories`);

  const [hotBev, coldBev, bakery, kitchen] = categories;

  // 4. Create Master Menu Items with BDT Pricing (৳)
  const itemsData = [
    {
      categoryId: hotBev.id,
      name: 'Signature Espresso',
      sku: 'COF-ESP-01',
      description: 'Double shot of single-origin Colombian beans with rich crema.',
      basePrice: new Prisma.Decimal('220.00'), // BDT ৳220
      imageUrl: 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=400&q=80',
    },
    {
      categoryId: hotBev.id,
      name: 'Velvet Cappuccino',
      sku: 'COF-CAP-02',
      description: 'Balanced espresso with silky microfoam and a dusting of cocoa.',
      basePrice: new Prisma.Decimal('320.00'), // BDT ৳320
      imageUrl: 'https://images.unsplash.com/photo-1534778101976-62847782c213?w=400&q=80',
    },
    {
      categoryId: hotBev.id,
      name: 'Spiced Masala Chai Latte',
      sku: 'TEA-MSL-01',
      description: 'Slow-brewed Sylheti black tea infused with cardamom, cinnamon, and steamed milk.',
      basePrice: new Prisma.Decimal('240.00'), // BDT ৳240
      imageUrl: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=400&q=80',
    },
    {
      categoryId: coldBev.id,
      name: 'Cold Brew Reserve',
      sku: 'COF-CBR-01',
      description: 'Steeped for 20 hours in cold filtered water. Smooth, velvety, and low acidity.',
      basePrice: new Prisma.Decimal('350.00'), // BDT ৳350
      imageUrl: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=400&q=80',
    },
    {
      categoryId: coldBev.id,
      name: 'Iced Vanilla Bean Latte',
      sku: 'COF-IVL-02',
      description: 'Espresso poured over iced whole milk and organic Madagascar vanilla bean.',
      basePrice: new Prisma.Decimal('390.00'), // BDT ৳390
      imageUrl: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&q=80',
    },
    {
      categoryId: bakery.id,
      name: 'French Butter Croissant',
      sku: 'BAK-CRS-01',
      description: 'Flaky, buttery multi-layered pastry baked fresh every morning.',
      basePrice: new Prisma.Decimal('260.00'), // BDT ৳260
      imageUrl: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400&q=80',
    },
    {
      categoryId: bakery.id,
      name: 'Almond Pain au Chocolat',
      sku: 'BAK-PAC-02',
      description: 'Filled with Belgian dark chocolate and topped with toasted sliced almonds.',
      basePrice: new Prisma.Decimal('320.00'), // BDT ৳320
      imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&q=80',
    },
    {
      categoryId: bakery.id,
      name: 'Wild Blueberry Muffin',
      sku: 'BAK-MUF-03',
      description: 'Loaded with wild blueberries and finished with raw sugar crumble.',
      basePrice: new Prisma.Decimal('250.00'), // BDT ৳250
      imageUrl: 'https://images.unsplash.com/photo-1607958996333-41aef7caefaa?w=400&q=80',
    },
    {
      categoryId: kitchen.id,
      name: 'Dhaka Special Beef Tehari',
      sku: 'KIT-TEH-01',
      description: 'Fragrant Chinigura rice cooked with tender mustard-infused spiced beef cuts.',
      basePrice: new Prisma.Decimal('480.00'), // BDT ৳480
      imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&q=80',
    },
    {
      categoryId: kitchen.id,
      name: 'Truffle Mushroom Melt',
      sku: 'KIT-TRF-02',
      description: 'Sauteed wild mushrooms, gruyere cheese, and truffle butter on toasted sourdough.',
      basePrice: new Prisma.Decimal('520.00'), // BDT ৳520
      imageUrl: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400&q=80',
    },
    {
      categoryId: kitchen.id,
      name: 'Gourmet Beef Smash Burger',
      sku: 'KIT-BUR-03',
      description: 'Double prime beef smashed patties, aged cheddar, pickles, and house sauce.',
      basePrice: new Prisma.Decimal('580.00'), // BDT ৳580
      imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80',
    },
  ];

  const createdItems = [];
  for (const item of itemsData) {
    const created = await prisma.menuItem.create({
      data: {
        companyId: company.id,
        ...item,
      },
    });
    createdItems.push(created);
  }
  console.log(`Created ${createdItems.length} Master Menu Items in BDT`);

  // 5. Assign Menu Items & Stock to Outlets
  // Gulshan-2 Flagship: Has ALL items at Base Price, healthy stock
  for (const item of createdItems) {
    await prisma.outletMenuItem.create({
      data: {
        outletId: gulshan.id,
        menuItemId: item.id,
        customPrice: null, // Default base price
        isAvailable: true,
      },
    });

    await prisma.inventory.create({
      data: {
        outletId: gulshan.id,
        menuItemId: item.id,
        quantity: item.name.includes('Muffin') ? 4 : 45, // Muffin set to 4 to demonstrate low stock
        lowStockThreshold: 5,
      },
    });
  }
  console.log(`Assigned all items to Gulshan-2 Flagship with inventory.`);

  // Dhanmondi Branch: Has custom price overrides on selected items
  for (const item of createdItems) {
    let overridePrice: Prisma.Decimal | null = null;
    if (item.sku === 'KIT-BUR-03') {
      overridePrice = new Prisma.Decimal('640.00'); // Override burger to ৳640
    } else if (item.sku === 'KIT-TEH-01') {
      overridePrice = new Prisma.Decimal('530.00'); // Override tehari to ৳530
    } else if (item.sku === 'COF-CBR-01') {
      overridePrice = new Prisma.Decimal('380.00'); // Override cold brew to ৳380
    }

    await prisma.outletMenuItem.create({
      data: {
        outletId: dhanmondi.id,
        menuItemId: item.id,
        customPrice: overridePrice,
        isAvailable: true,
      },
    });

    await prisma.inventory.create({
      data: {
        outletId: dhanmondi.id,
        menuItemId: item.id,
        quantity: 35,
        lowStockThreshold: 5,
      },
    });
  }
  console.log(`Assigned items to Dhanmondi Branch with custom price overrides and inventory.`);

  // Uttara Hub: Has only Beverages and Bakery (Beverages & Bakery only, no kitchen)
  const uttaraItems = createdItems.filter((i) => i.categoryId === hotBev.id || i.categoryId === coldBev.id || i.categoryId === bakery.id);
  for (const item of uttaraItems) {
    await prisma.outletMenuItem.create({
      data: {
        outletId: uttara.id,
        menuItemId: item.id,
        customPrice: null,
        isAvailable: true,
      },
    });

    await prisma.inventory.create({
      data: {
        outletId: uttara.id,
        menuItemId: item.id,
        quantity: 30,
        lowStockThreshold: 5,
      },
    });
  }
  console.log(`Assigned ${uttaraItems.length} items to Uttara Hub (Beverages & Bakery only).`);

  // 6. Create Initial Realistic Completed Sales for Reporting in BDT (৳)
  console.log('Generating seed sales transactions in BDT for reporting...');

  // Sale 1 at Gulshan: 2 Espresso (440) + 1 Cappuccino (320) + 1 Tehari (480) + 2 Croissants (520) = 1760.00
  await prisma.sale.create({
    data: {
      outletId: gulshan.id,
      receiptNumber: 'REC-GLS-000001',
      receiptSequence: 1,
      subtotal: new Prisma.Decimal('1760.00'),
      tax: new Prisma.Decimal('176.00'),
      totalAmount: new Prisma.Decimal('1936.00'),
      paymentMethod: 'CARD',
      status: 'COMPLETED',
      items: {
        create: [
          { menuItemId: createdItems[0].id, quantity: 2, unitPrice: new Prisma.Decimal('220.00'), subtotal: new Prisma.Decimal('440.00') },
          { menuItemId: createdItems[1].id, quantity: 1, unitPrice: new Prisma.Decimal('320.00'), subtotal: new Prisma.Decimal('320.00') },
          { menuItemId: createdItems[8].id, quantity: 1, unitPrice: new Prisma.Decimal('480.00'), subtotal: new Prisma.Decimal('480.00') },
          { menuItemId: createdItems[5].id, quantity: 2, unitPrice: new Prisma.Decimal('260.00'), subtotal: new Prisma.Decimal('520.00') },
        ],
      },
    },
  });

  // Sale 2 at Gulshan: 2 Gourmet Burgers (1160.00) = 1160.00
  await prisma.sale.create({
    data: {
      outletId: gulshan.id,
      receiptNumber: 'REC-GLS-000002',
      receiptSequence: 2,
      subtotal: new Prisma.Decimal('1160.00'),
      tax: new Prisma.Decimal('116.00'),
      totalAmount: new Prisma.Decimal('1276.00'),
      paymentMethod: 'QRIS',
      status: 'COMPLETED',
      items: {
        create: [
          { menuItemId: createdItems[10].id, quantity: 2, unitPrice: new Prisma.Decimal('580.00'), subtotal: new Prisma.Decimal('1160.00') },
        ],
      },
    },
  });

  // Update Gulshan counter to 2
  await prisma.outlet.update({
    where: { id: gulshan.id },
    data: { receiptCounter: 2 },
  });

  // Sale 1 at Dhanmondi: 2 Cappuccinos (640) + 1 Iced Vanilla Latte (390) + 1 Croissant (260) = 1290.00
  await prisma.sale.create({
    data: {
      outletId: dhanmondi.id,
      receiptNumber: 'REC-DHN-000001',
      receiptSequence: 1,
      subtotal: new Prisma.Decimal('1290.00'),
      tax: new Prisma.Decimal('129.00'),
      totalAmount: new Prisma.Decimal('1419.00'),
      paymentMethod: 'CASH',
      status: 'COMPLETED',
      items: {
        create: [
          { menuItemId: createdItems[1].id, quantity: 2, unitPrice: new Prisma.Decimal('320.00'), subtotal: new Prisma.Decimal('640.00') },
          { menuItemId: createdItems[4].id, quantity: 1, unitPrice: new Prisma.Decimal('390.00'), subtotal: new Prisma.Decimal('390.00') },
          { menuItemId: createdItems[5].id, quantity: 1, unitPrice: new Prisma.Decimal('260.00'), subtotal: new Prisma.Decimal('260.00') },
        ],
      },
    },
  });

  // Update Dhanmondi counter to 1
  await prisma.outlet.update({
    where: { id: dhanmondi.id },
    data: { receiptCounter: 1 },
  });

  console.log('Seeding with Bangladeshi locations and BDT completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
