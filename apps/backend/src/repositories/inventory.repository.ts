import { prisma } from '../config/prisma';
import { Prisma } from '@prisma/client';

export class InventoryRepository {
  async findByOutletId(
    outletId: string,
    params?: { lowStockOnly?: boolean; search?: string }
  ) {
    const where: Prisma.InventoryWhereInput = { outletId };

    if (params?.search) {
      where.menuItem = {
        OR: [
          { name: { contains: params.search, mode: 'insensitive' } },
          { sku: { contains: params.search, mode: 'insensitive' } },
        ],
      };
    }

    const items = await prisma.inventory.findMany({
      where,
      include: {
        menuItem: {
          include: {
            category: true,
            outletAssignments: {
              where: { outletId },
              select: { customPrice: true, isAvailable: true },
            },
          },
        },
      },
      orderBy: { menuItem: { name: 'asc' } },
    });

    if (params?.lowStockOnly) {
      return items.filter((inv) => inv.quantity <= inv.lowStockThreshold);
    }

    return items;
  }

  async findByOutletAndItem(outletId: string, menuItemId: string) {
    return prisma.inventory.findUnique({
      where: {
        outletId_menuItemId: { outletId, menuItemId },
      },
      include: {
        menuItem: true,
      },
    });
  }

  async updateStock(outletId: string, menuItemId: string, quantity: number) {
    return prisma.inventory.upsert({
      where: {
        outletId_menuItemId: { outletId, menuItemId },
      },
      create: {
        outletId,
        menuItemId,
        quantity,
      },
      update: {
        quantity,
      },
      include: { menuItem: true },
    });
  }

  async restock(outletId: string, menuItemId: string, addedQuantity: number) {
    return prisma.inventory.upsert({
      where: {
        outletId_menuItemId: { outletId, menuItemId },
      },
      create: {
        outletId,
        menuItemId,
        quantity: addedQuantity,
      },
      update: {
        quantity: { increment: addedQuantity },
      },
      include: { menuItem: true },
    });
  }

  /**
   * Atomic stock deduction inside an active transaction.
   * Utilizes conditional UPDATE to ensure quantity never drops below requested amount.
   * Returns remaining stock, or null if insufficient stock.
   */
  async deductStockAtomic(
    tx: Prisma.TransactionClient,
    outletId: string,
    menuItemId: string,
    quantityToDeduct: number
  ): Promise<{ remainingQuantity: number } | null> {
    const result = await tx.$queryRaw<{ quantity: number }[]>`
      UPDATE "Inventory"
      SET "quantity" = "quantity" - ${quantityToDeduct}
      WHERE "outletId" = ${outletId}
        AND "menuItemId" = ${menuItemId}
        AND "quantity" >= ${quantityToDeduct}
      RETURNING "quantity"
    `;

    if (!result || result.length === 0) {
      return null;
    }

    return { remainingQuantity: result[0].quantity };
  }
}

export const inventoryRepository = new InventoryRepository();

