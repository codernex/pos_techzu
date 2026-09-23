import { prisma } from '../src/config/prisma';
import { saleService } from '../src/services/sale.service';
import { inventoryService } from '../src/services/inventory.service';

async function runConcurrencyTests() {
  console.log('========================================================');
  console.log('STARTING CONCURRENCY & INTEGRITY VERIFICATION SUITE');
  console.log('========================================================\n');

  // Find Gulshan outlet
  const outlet = await prisma.outlet.findFirst({ where: { code: 'GLS' } });
  if (!outlet) throw new Error('Gulshan outlet not found. Run db:seed first.');

  // Find an available item at Gulshan
  const assignment = await prisma.outletMenuItem.findFirst({
    where: { outletId: outlet.id, isAvailable: true },
    include: { menuItem: true },
  });
  if (!assignment) throw new Error('No assigned menu items found for Gulshan.');

  const menuItemId = assignment.menuItemId;

  // -----------------------------------------------------------
  // TEST 1: Sequential Receipt Number Generation Under Concurrency
  // -----------------------------------------------------------
  console.log('▶ TEST 1: Concurrent Sales -> Verify strictly sequential receipt numbers');

  // Set sufficient stock for 15 sales of 1 item
  await inventoryService.updateStock(outlet.id, menuItemId, 200);

  const CONCURRENT_REQUESTS = 15;
  console.log(`Firing ${CONCURRENT_REQUESTS} simultaneous sales requests for Outlet: ${outlet.code}...`);

  const startTime = Date.now();
  const promises = Array.from({ length: CONCURRENT_REQUESTS }, (_, index) =>
    saleService.createSale({
      outletId: outlet.id,
      items: [{ menuItemId, quantity: 1 }],
      paymentMethod: 'CARD',
      cashierNote: `Concurrent test order #${index + 1}`,
    })
  );

  const results = await Promise.all(promises);
  const duration = Date.now() - startTime;

  const receiptNumbers = results.map((r) => r.receiptNumber);
  const receiptSequences = results.map((r) => r.receiptSequence).sort((a, b) => a - b);
  const uniqueReceipts = new Set(receiptNumbers);

  console.log(`Completed ${CONCURRENT_REQUESTS} concurrent checkouts in ${duration}ms`);
  console.log(`Generated receipts:`, receiptNumbers);

  if (uniqueReceipts.size !== CONCURRENT_REQUESTS) {
    throw new Error(
      `FAILURE: Duplicate receipts detected! Expected ${CONCURRENT_REQUESTS} unique, got ${uniqueReceipts.size}`
    );
  }

  // Verify strictly sequential (no gaps in sequences)
  for (let i = 1; i < receiptSequences.length; i++) {
    if (receiptSequences[i] !== receiptSequences[i - 1] + 1) {
      throw new Error(
        `FAILURE: Gap or non-sequential receipt sequence! Sequence: ${receiptSequences.join(', ')}`
      );
    }
  }

  console.log('✔ PASS: All receipt numbers are unique, strictly sequential, and collision-free!\n');

  // -----------------------------------------------------------
  // TEST 2: Prevention of Negative Stock Under High Concurrency
  // -----------------------------------------------------------
  console.log('▶ TEST 2: High Concurrency Oversell -> Verify negative stock is strictly prevented');

  const INITIAL_STOCK = 3;
  const ATTEMPTED_BUYERS = 10; // 10 buyers try to buy 1 item each when only 3 are in stock!

  console.log(`Setting stock of "${assignment.menuItem.name}" to exactly ${INITIAL_STOCK}...`);
  await inventoryService.updateStock(outlet.id, menuItemId, INITIAL_STOCK);

  console.log(`Firing ${ATTEMPTED_BUYERS} simultaneous checkout requests for ${INITIAL_STOCK} available items...`);

  let succeededCount = 0;
  let rejectedCount = 0;
  const errors: string[] = [];

  const oversellPromises = Array.from({ length: ATTEMPTED_BUYERS }, (_, idx) =>
    saleService
      .createSale({
        outletId: outlet.id,
        items: [{ menuItemId, quantity: 1 }],
        paymentMethod: 'CASH',
        cashierNote: `Oversell buyer #${idx + 1}`,
      })
      .then(() => {
        succeededCount++;
      })
      .catch((err) => {
        rejectedCount++;
        errors.push(err.message);
      })
  );

  await Promise.all(oversellPromises);

  // Check final inventory in database directly
  const finalInventory = await prisma.inventory.findUnique({
    where: {
      outletId_menuItemId: { outletId: outlet.id, menuItemId },
    },
  });

  console.log(`Results: ${succeededCount} succeeded, ${rejectedCount} rejected with InsufficientStock`);
  console.log(`Final Database Inventory Quantity: ${finalInventory?.quantity}`);

  if (succeededCount !== INITIAL_STOCK) {
    throw new Error(
      `FAILURE: Expected exactly ${INITIAL_STOCK} sales to succeed, but ${succeededCount} succeeded!`
    );
  }

  if (rejectedCount !== ATTEMPTED_BUYERS - INITIAL_STOCK) {
    throw new Error(
      `FAILURE: Expected ${ATTEMPTED_BUYERS - INITIAL_STOCK} sales to be rejected, but ${rejectedCount} were rejected!`
    );
  }

  if (finalInventory?.quantity !== 0) {
    throw new Error(
      `FAILURE: Stock should be exactly 0, found: ${finalInventory?.quantity}`
    );
  }

  console.log('✔ PASS: System safely prevented negative stock! Zero oversells, exact zero inventory remainder.\n');

  console.log('========================================================');
  console.log('ALL CONCURRENCY & INTEGRITY VERIFICATIONS PASSED 100%!');
  console.log('========================================================');
}

runConcurrencyTests()
  .catch((e) => {
    console.error('\n✖ TEST SUITE FAILED:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

