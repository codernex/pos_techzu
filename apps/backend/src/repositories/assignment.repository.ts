import { prisma } from '../config/prisma';
import { Prisma } from '@prisma/client';

export class AssignmentRepository {
  async findOutletMenu(
    outletId: string,
    params?: { categoryId?: string; availableOnly?: boolean; search?: string }
  ) {
    const where: Prisma.OutletMenuItemWhereInput = {
      outletId,
    };

    const menuItemWhere: Prisma.MenuItemWhereInput = {};

    if (params?.availableOnly) {
      where.isAvailable = true;
      menuItemWhere.isActive = true;
    }

    if (params?.categoryId) {
      menuItemWhere.categoryId = params.categoryId;
    }

    if (params?.search) {
      menuItemWhere.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { sku: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    if (Object.keys(menuItemWhere).length > 0) {
      where.menuItem = { is: menuItemWhere };
    }

    return prisma.outletMenuItem.findMany({
      where,
      include: {
        menuItem: {
          include: {
            category: true,
            inventories: {
              where: { outletId },
              select: { quantity: true, lowStockThreshold: true },
            },
          },
        },
      },
      orderBy: {
        menuItem: { name: 'asc' },
      },
    });
  }

  async findAssignment(outletId: string, menuItemId: string) {
    return prisma.outletMenuItem.findUnique({
      where: {
        outletId_menuItemId: { outletId, menuItemId },
      },
      include: { menuItem: true, outlet: true },
    });
  }

  async assign(data: {
    outletId: string;
    menuItemId: string;
    customPrice?: number | string | Prisma.Decimal | null;
    isAvailable?: boolean;
    initialStock?: number;
  }) {
    return prisma.$transaction(async (tx) => {
      const assignment = await tx.outletMenuItem.upsert({
        where: {
          outletId_menuItemId: {
            outletId: data.outletId,
            menuItemId: data.menuItemId,
          },
        },
        create: {
          outletId: data.outletId,
          menuItemId: data.menuItemId,
          customPrice:
            data.customPrice !== undefined && data.customPrice !== null
              ? new Prisma.Decimal(data.customPrice)
              : null,
          isAvailable: data.isAvailable ?? true,
        },
        update: {
          customPrice:
            data.customPrice !== undefined && data.customPrice !== null
              ? new Prisma.Decimal(data.customPrice)
              : null,
          ...(data.isAvailable !== undefined ? { isAvailable: data.isAvailable } : {}),
        },
        include: {
          menuItem: true,
          outlet: true,
        },
      });

      // Ensure inventory record exists for this outlet + item
      await tx.inventory.upsert({
        where: {
          outletId_menuItemId: {
            outletId: data.outletId,
            menuItemId: data.menuItemId,
          },
        },
        create: {
          outletId: data.outletId,
          menuItemId: data.menuItemId,
          quantity: data.initialStock ?? 0,
        },
        update: {
          ...(data.initialStock !== undefined ? { quantity: data.initialStock } : {}),
        },
      });

      return assignment;
    });
  }

  async bulkAssign(
    outletId: string,
    items: Array<{
      menuItemId: string;
      customPrice?: number | string | null;
      isAvailable?: boolean;
      initialStock?: number;
    }>
  ) {
    return prisma.$transaction(async (tx) => {
      const results = [];
      for (const item of items) {
        const assignment = await tx.outletMenuItem.upsert({
          where: {
            outletId_menuItemId: {
              outletId,
              menuItemId: item.menuItemId,
            },
          },
          create: {
            outletId,
            menuItemId: item.menuItemId,
            customPrice:
              item.customPrice !== undefined && item.customPrice !== null
                ? new Prisma.Decimal(item.customPrice)
                : null,
            isAvailable: item.isAvailable ?? true,
          },
          update: {
            customPrice:
              item.customPrice !== undefined && item.customPrice !== null
                ? new Prisma.Decimal(item.customPrice)
                : null,
            ...(item.isAvailable !== undefined ? { isAvailable: item.isAvailable } : {}),
          },
        });

        await tx.inventory.upsert({
          where: {
            outletId_menuItemId: {
              outletId,
              menuItemId: item.menuItemId,
            },
          },
          create: {
            outletId,
            menuItemId: item.menuItemId,
            quantity: item.initialStock ?? 0,
          },
          update: {},
        });

        results.push(assignment);
      }
      return results;
    });
  }

  async unassign(outletId: string, menuItemId: string) {
    return prisma.outletMenuItem.delete({
      where: {
        outletId_menuItemId: { outletId, menuItemId },
      },
    });
  }
}

export const assignmentRepository = new AssignmentRepository();
