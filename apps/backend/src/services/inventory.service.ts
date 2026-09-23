import { inventoryRepository } from '../repositories/inventory.repository';
import { outletRepository } from '../repositories/outlet.repository';
import { menuRepository } from '../repositories/menu.repository';
import { BadRequestError, NotFoundError } from '../errors/AppError';

export class InventoryService {
  async getOutletInventory(
    outletId: string,
    params?: { lowStockOnly?: boolean; search?: string }
  ) {
    const outlet = await outletRepository.findById(outletId);
    if (!outlet) {
      throw new NotFoundError(`Outlet with ID ${outletId} not found`);
    }

    const items = await inventoryRepository.findByOutletId(outletId, params);

    return items.map((inv) => {
      const assignment = inv.menuItem.outletAssignments[0];
      const customPrice = assignment?.customPrice ?? null;
      const effectivePrice = customPrice !== null ? customPrice : inv.menuItem.basePrice;

      return {
        id: inv.id,
        outletId: inv.outletId,
        menuItemId: inv.menuItemId,
        name: inv.menuItem.name,
        sku: inv.menuItem.sku,
        category: inv.menuItem.category,
        basePrice: inv.menuItem.basePrice,
        customPrice,
        effectivePrice,
        isAssigned: !!assignment,
        isAvailable: assignment?.isAvailable ?? false,
        quantity: inv.quantity,
        lowStockThreshold: inv.lowStockThreshold,
        isLowStock: inv.quantity <= inv.lowStockThreshold,
        isOutOfStock: inv.quantity <= 0,
        updatedAt: inv.updatedAt,
      };
    });
  }

  async updateStock(outletId: string, menuItemId: string, quantity: number) {
    if (quantity < 0) {
      throw new BadRequestError('Inventory quantity cannot be negative');
    }

    const [outlet, menuItem] = await Promise.all([
      outletRepository.findById(outletId),
      menuRepository.findMenuItemById(menuItemId),
    ]);

    if (!outlet) throw new NotFoundError(`Outlet with ID ${outletId} not found`);
    if (!menuItem) throw new NotFoundError(`Menu item with ID ${menuItemId} not found`);

    return inventoryRepository.updateStock(outletId, menuItemId, quantity);
  }

  async restock(outletId: string, menuItemId: string, addedQuantity: number) {
    if (addedQuantity <= 0) {
      throw new BadRequestError('Restock quantity must be greater than zero');
    }

    const [outlet, menuItem] = await Promise.all([
      outletRepository.findById(outletId),
      menuRepository.findMenuItemById(menuItemId),
    ]);

    if (!outlet) throw new NotFoundError(`Outlet with ID ${outletId} not found`);
    if (!menuItem) throw new NotFoundError(`Menu item with ID ${menuItemId} not found`);

    return inventoryRepository.restock(outletId, menuItemId, addedQuantity);
  }
}

export const inventoryService = new InventoryService();

