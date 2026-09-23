import { Router } from 'express';
import { inventoryController } from '../controllers/inventory.controller';
import { validate } from '../middlewares/validate';
import { updateStockSchema, restockSchema } from '../validations';

const router = Router();

// Retrieve inventory for an outlet
router.get('/:outletId/inventory', (req, res, next) =>
  inventoryController.getOutletInventory(req, res, next)
);

// Update/set exact stock quantity
router.put(
  '/:outletId/inventory/:menuItemId',
  validate({ body: updateStockSchema }),
  (req, res, next) => inventoryController.updateStock(req, res, next)
);

// Restock (increment) stock
router.post(
  '/:outletId/inventory/:menuItemId/restock',
  validate({ body: restockSchema }),
  (req, res, next) => inventoryController.restock(req, res, next)
);

export default router;

