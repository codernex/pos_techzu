import { Request, Response, NextFunction } from 'express';
import { inventoryService } from '../services/inventory.service';
import { getParam } from '../utils/params';

export class InventoryController {
  async getOutletInventory(req: Request, res: Response, next: NextFunction) {
    try {
      const outletId = getParam(req.params.outletId, 'outletId');
      const { lowStockOnly, search } = req.query;
      const inventory = await inventoryService.getOutletInventory(outletId, {
        lowStockOnly: lowStockOnly === 'true',
        search: search as string,
      });
      res.json({ success: true, data: inventory });
    } catch (error) {
      next(error);
    }
  }

  async updateStock(req: Request, res: Response, next: NextFunction) {
    try {
      const outletId = getParam(req.params.outletId, 'outletId');
      const menuItemId = getParam(req.params.menuItemId, 'menuItemId');
      const inventory = await inventoryService.updateStock(
        outletId,
        menuItemId,
        req.body.quantity
      );
      res.json({ success: true, data: inventory });
    } catch (error) {
      next(error);
    }
  }

  async restock(req: Request, res: Response, next: NextFunction) {
    try {
      const outletId = getParam(req.params.outletId, 'outletId');
      const menuItemId = getParam(req.params.menuItemId, 'menuItemId');
      const inventory = await inventoryService.restock(
        outletId,
        menuItemId,
        req.body.addedQuantity
      );
      res.json({ success: true, data: inventory });
    } catch (error) {
      next(error);
    }
  }
}

export const inventoryController = new InventoryController();

