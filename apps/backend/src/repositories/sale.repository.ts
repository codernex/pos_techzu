import { prisma } from '../config/prisma';
import { Prisma } from '@prisma/client';
import { outletRepository } from './outlet.repository';
import { inventoryRepository } from './inventory.repository';
import { InsufficientStockError, NotFoundError } from '../errors/AppError';

export interface SaleItemInput {
  menuItemId: string;
  quantity: number;
}

export interface CreateSaleParams {
  outletId: string;
  items: SaleItemInput[];
  paymentMethod?: string;
  cashierNote?: string;
  taxRate?: number; // e.g. 0.1 for 10%
}

export class SaleRepository {
  async findByOutletId(
    outletId: string,
    params?: { limit?: number; offset?: number; startDate?: Date; endDate?: Date }
  ) {
    const where: Prisma.SaleWhereInput = { outletId };

    if (params?.startDate || params?.endDate) {
      where.createdAt = {};
      if (params.startDate) where.createdAt.gte = params.startDate;
      if (params.endDate) where.createdAt.lte = params.endDate;
    }

    const [total, sales] = await Promise.all([
      prisma.sale.count({ where }),
      prisma.sale.findMany({
        where,
        include: {
          items: {
            include: {
              menuItem: { select: { name: true, sku: true } },
            },
          },
          outlet: { select: { id: true, name: true, code: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: params?.limit ?? 50,
        skip: params?.offset ?? 0,
      }),
    ]);

    return { total, sales };
  }

  async findById(id: string) {
    return prisma.sale.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            menuItem: { select: { id: true, name: true, sku: true } },
          },
        },
        outlet: true,
      },
    });
  }

  async findByReceiptNumber(receiptNumber: string) {
    return prisma.sale.findUnique({
      where: { receiptNumber },
      include: {
        items: {
          include: {
            menuItem: { select: { id: true, name: true, sku: true } },
          },
        },
        outlet: true,
      },
    });
  }

  /**
   * Complete ACID sales transaction.
   * Wraps in Prisma interactive transaction:
   * 1. Locks outlet and generates atomic sequential receipt number under concurrency.
   * 2. Checks and deducts stock per item with row-level locking & conditional SQL to prevent negative stock.
   * 3. Creates Sale and SaleItem records.
   */
  async createSaleTransaction(params: CreateSaleParams) {
    return prisma.$transaction(
      async (tx) => {
        // Step 1: Verify outlet exists and lock its counter atomically
        const { receiptSequence, outletCode } =
          await outletRepository.incrementAndGetReceiptSequence(tx, params.outletId);

        const receiptNumber = `REC-${outletCode}-${String(receiptSequence).padStart(6, '0')}`;

        // Step 2: Fetch pricing for all items (considering outlet price overrides)
        const menuItemIds = params.items.map((i) => i.menuItemId);
        const [menuItems, outletAssignments] = await Promise.all([
          tx.menuItem.findMany({
            where: { id: { in: menuItemIds }, isActive: true },
          }),
          tx.outletMenuItem.findMany({
            where: { outletId: params.outletId, menuItemId: { in: menuItemIds } },
          }),
        ]);

        const menuItemMap = new Map(menuItems.map((m) => [m.id, m]));
        const assignmentMap = new Map(outletAssignments.map((a) => [a.menuItemId, a]));

        // Calculate line items and verify assignment
        let subtotalDecimal = new Prisma.Decimal(0);
        const saleItemsToCreate: Array<{
          menuItemId: string;
          quantity: number;
          unitPrice: Prisma.Decimal;
          subtotal: Prisma.Decimal;
        }> = [];

        for (const itemInput of params.items) {
          const menuItem = menuItemMap.get(itemInput.menuItemId);
          if (!menuItem) {
            throw new NotFoundError(`Menu item ${itemInput.menuItemId} not found or inactive`);
          }

          const assignment = assignmentMap.get(itemInput.menuItemId);
          if (!assignment || !assignment.isAvailable) {
            throw new InsufficientStockError(
              `Menu item "${menuItem.name}" is not assigned or unavailable at this outlet`
            );
          }

          // Effective price: customPrice if set, otherwise basePrice
          const unitPrice = assignment.customPrice ?? menuItem.basePrice;
          const lineSubtotal = unitPrice.mul(itemInput.quantity);
          subtotalDecimal = subtotalDecimal.add(lineSubtotal);

          saleItemsToCreate.push({
            menuItemId: itemInput.menuItemId,
            quantity: itemInput.quantity,
            unitPrice,
            subtotal: lineSubtotal,
          });

          // Step 3: Atomic stock deduction with negative-stock prevention
          const deductResult = await inventoryRepository.deductStockAtomic(
            tx,
            params.outletId,
            itemInput.menuItemId,
            itemInput.quantity
          );

          if (!deductResult) {
            // Fetch current stock to give a descriptive error
            const currentStock = await tx.inventory.findUnique({
              where: {
                outletId_menuItemId: {
                  outletId: params.outletId,
                  menuItemId: itemInput.menuItemId,
                },
              },
            });
            const available = currentStock?.quantity ?? 0;
            throw new InsufficientStockError(
              `Insufficient stock for "${menuItem.name}". Requested: ${itemInput.quantity}, Available: ${available}`
            );
          }
        }

        // Step 4: Calculate tax and total
        const taxRate = params.taxRate ?? 0.1; // 10% default tax
        const taxDecimal = subtotalDecimal.mul(taxRate);
        const totalAmountDecimal = subtotalDecimal.add(taxDecimal);

        // Step 5: Persist Sale Header and Line Items
        const createdSale = await tx.sale.create({
          data: {
            outletId: params.outletId,
            receiptNumber,
            receiptSequence,
            subtotal: subtotalDecimal,
            tax: taxDecimal,
            totalAmount: totalAmountDecimal,
            paymentMethod: params.paymentMethod ?? 'CASH',
            cashierNote: params.cashierNote,
            status: 'COMPLETED',
            items: {
              create: saleItemsToCreate.map((item) => ({
                menuItemId: item.menuItemId,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                subtotal: item.subtotal,
              })),
            },
          },
          include: {
            items: {
              include: {
                menuItem: { select: { id: true, name: true, sku: true } },
              },
            },
            outlet: { select: { id: true, name: true, code: true, address: true, phone: true } },
          },
        });

        return createdSale;
      },
      {
        // Set transaction isolation and timeout
        isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
        maxWait: 5000,
        timeout: 10000,
      }
    );
  }
}

export const saleRepository = new SaleRepository();

