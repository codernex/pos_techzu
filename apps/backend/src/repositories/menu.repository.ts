import { prisma } from '../config/prisma';
import { Prisma } from '@prisma/client';

export class MenuRepository {
  async findAllCategories() {
    return prisma.category.findMany({
      include: {
        _count: { select: { menuItems: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findCategoryById(id: string) {
    return prisma.category.findUnique({ where: { id } });
  }

  async createCategory(data: { name: string; description?: string }) {
    return prisma.category.create({ data });
  }

  async findAllMenuItems(params?: {
    categoryId?: string;
    search?: string;
    isActive?: boolean;
  }) {
    const where: Prisma.MenuItemWhereInput = {};

    if (params?.categoryId) {
      where.categoryId = params.categoryId;
    }
    if (params?.isActive !== undefined) {
      where.isActive = params.isActive;
    }
    if (params?.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { sku: { contains: params.search, mode: 'insensitive' } },
        { description: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    return prisma.menuItem.findMany({
      where,
      include: {
        category: true,
        outletAssignments: {
          include: {
            outlet: { select: { id: true, name: true, code: true } },
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findMenuItemById(id: string) {
    return prisma.menuItem.findUnique({
      where: { id },
      include: {
        category: true,
        outletAssignments: {
          include: {
            outlet: { select: { id: true, name: true, code: true } },
          },
        },
      },
    });
  }

  async findMenuItemBySku(sku: string) {
    return prisma.menuItem.findUnique({
      where: { sku: sku.toUpperCase() },
    });
  }

  async createMenuItem(data: {
    companyId: string;
    categoryId: string;
    name: string;
    sku: string;
    description?: string;
    basePrice: number | string | Prisma.Decimal;
    imageUrl?: string;
    isActive?: boolean;
  }) {
    return prisma.menuItem.create({
      data: {
        companyId: data.companyId,
        categoryId: data.categoryId,
        name: data.name,
        sku: data.sku.toUpperCase(),
        description: data.description,
        basePrice: new Prisma.Decimal(data.basePrice),
        imageUrl: data.imageUrl,
        isActive: data.isActive ?? true,
      },
      include: {
        category: true,
      },
    });
  }

  async updateMenuItem(
    id: string,
    data: Partial<{
      categoryId: string;
      name: string;
      sku: string;
      description: string;
      basePrice: number | string | Prisma.Decimal;
      imageUrl: string;
      isActive: boolean;
    }>
  ) {
    return prisma.menuItem.update({
      where: { id },
      data: {
        ...data,
        ...(data.sku ? { sku: data.sku.toUpperCase() } : {}),
        ...(data.basePrice !== undefined ? { basePrice: new Prisma.Decimal(data.basePrice) } : {}),
      },
      include: { category: true },
    });
  }

  async deleteMenuItem(id: string) {
    return prisma.menuItem.delete({ where: { id } });
  }
}

export const menuRepository = new MenuRepository();

