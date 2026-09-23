import { menuRepository } from '../repositories/menu.repository';
import { ConflictError, NotFoundError } from '../errors/AppError';
import { prisma } from '../config/prisma';

export class MenuService {
  async getCategories() {
    return menuRepository.findAllCategories();
  }

  async createCategory(data: { name: string; description?: string }) {
    const existing = await prisma.category.findUnique({
      where: { name: data.name },
    });
    if (existing) {
      throw new ConflictError(`Category "${data.name}" already exists`);
    }
    return menuRepository.createCategory(data);
  }

  async getAllMenuItems(params?: { categoryId?: string; search?: string; isActive?: boolean }) {
    return menuRepository.findAllMenuItems(params);
  }

  async getMenuItemById(id: string) {
    const item = await menuRepository.findMenuItemById(id);
    if (!item) {
      throw new NotFoundError(`Menu item with ID ${id} not found`);
    }
    return item;
  }

  async createMenuItem(data: {
    name: string;
    sku: string;
    categoryId: string;
    basePrice: number | string;
    description?: string;
    imageUrl?: string;
    isActive?: boolean;
    companyId?: string;
  }) {
    const existingSku = await menuRepository.findMenuItemBySku(data.sku);
    if (existingSku) {
      throw new ConflictError(`Menu item with SKU "${data.sku}" already exists`);
    }

    const category = await menuRepository.findCategoryById(data.categoryId);
    if (!category) {
      throw new NotFoundError(`Category with ID ${data.categoryId} not found`);
    }

    let companyId = data.companyId;
    if (!companyId) {
      const company = await prisma.company.findFirst();
      if (!company) {
        throw new NotFoundError('Company not found. Please create or seed a company first.');
      }
      companyId = company.id;
    }

    return menuRepository.createMenuItem({
      ...data,
      companyId,
    });
  }

  async updateMenuItem(
    id: string,
    data: Partial<{
      name: string;
      sku: string;
      categoryId: string;
      basePrice: number | string;
      description: string;
      imageUrl: string;
      isActive: boolean;
    }>
  ) {
    await this.getMenuItemById(id);

    if (data.sku) {
      const existing = await menuRepository.findMenuItemBySku(data.sku);
      if (existing && existing.id !== id) {
        throw new ConflictError(`Menu item with SKU "${data.sku}" already exists`);
      }
    }

    if (data.categoryId) {
      const cat = await menuRepository.findCategoryById(data.categoryId);
      if (!cat) {
        throw new NotFoundError(`Category with ID ${data.categoryId} not found`);
      }
    }

    return menuRepository.updateMenuItem(id, data);
  }

  async deleteMenuItem(id: string) {
    await this.getMenuItemById(id);
    return menuRepository.deleteMenuItem(id);
  }
}

export const menuService = new MenuService();

