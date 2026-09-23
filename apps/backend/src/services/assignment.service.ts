import { assignmentRepository } from '../repositories/assignment.repository';
import { outletRepository } from '../repositories/outlet.repository';
import { menuRepository } from '../repositories/menu.repository';
import { NotFoundError } from '../errors/AppError';

export class AssignmentService {
  async getOutletMenu(
    outletId: string,
    params?: { categoryId?: string; availableOnly?: boolean; search?: string }
  ) {
    const outlet = await outletRepository.findById(outletId);
    if (!outlet) {
      throw new NotFoundError(`Outlet with ID ${outletId} not found`);
    }

    const assignments = await assignmentRepository.findOutletMenu(outletId, params);

    // Format output with effectivePrice and currentStock
    return assignments.map((a) => {
      const effectivePrice = a.customPrice !== null ? a.customPrice : a.menuItem.basePrice;
      const stock = a.menuItem.inventories[0]?.quantity ?? 0;
      const lowStockThreshold = a.menuItem.inventories[0]?.lowStockThreshold ?? 5;

      return {
        assignmentId: a.id,
        outletId: a.outletId,
        menuItemId: a.menuItemId,
        name: a.menuItem.name,
        sku: a.menuItem.sku,
        description: a.menuItem.description,
        imageUrl: a.menuItem.imageUrl,
        category: a.menuItem.category,
        basePrice: a.menuItem.basePrice,
        customPrice: a.customPrice,
        effectivePrice,
        isAvailable: a.isAvailable,
        stock,
        lowStockThreshold,
        isLowStock: stock <= lowStockThreshold,
        isOutOfStock: stock <= 0,
      };
    });
  }

  async assignMenuItem(data: {
    outletId: string;
    menuItemId: string;
    customPrice?: number | string | null;
    isAvailable?: boolean;
    initialStock?: number;
  }) {
    const [outlet, menuItem] = await Promise.all([
      outletRepository.findById(data.outletId),
      menuRepository.findMenuItemById(data.menuItemId),
    ]);

    if (!outlet) {
      throw new NotFoundError(`Outlet with ID ${data.outletId} not found`);
    }
    if (!menuItem) {
      throw new NotFoundError(`Menu item with ID ${data.menuItemId} not found`);
    }

    return assignmentRepository.assign(data);
  }

  async bulkAssignMenuItems(
    outletId: string,
    items: Array<{
      menuItemId: string;
      customPrice?: number | string | null;
      isAvailable?: boolean;
      initialStock?: number;
    }>
  ) {
    const outlet = await outletRepository.findById(outletId);
    if (!outlet) {
      throw new NotFoundError(`Outlet with ID ${outletId} not found`);
    }

    return assignmentRepository.bulkAssign(outletId, items);
  }

  async overridePrice(outletId: string, menuItemId: string, customPrice: number | string | null) {
    const assignment = await assignmentRepository.findAssignment(outletId, menuItemId);
    if (!assignment) {
      throw new NotFoundError(`Assignment for item ${menuItemId} at outlet ${outletId} not found`);
    }

    return assignmentRepository.assign({
      outletId,
      menuItemId,
      customPrice,
    });
  }

  async unassignMenuItem(outletId: string, menuItemId: string) {
    const assignment = await assignmentRepository.findAssignment(outletId, menuItemId);
    if (!assignment) {
      throw new NotFoundError(`Assignment for item ${menuItemId} at outlet ${outletId} not found`);
    }

    return assignmentRepository.unassign(outletId, menuItemId);
  }
}

export const assignmentService = new AssignmentService();

