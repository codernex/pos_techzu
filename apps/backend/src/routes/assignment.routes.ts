import { Router } from 'express';
import { assignmentController } from '../controllers/assignment.controller';
import { validate } from '../middlewares/validate';
import {
  assignMenuItemSchema,
  bulkAssignSchema,
  overridePriceSchema,
} from '../validations';

const router = Router();

// Retrieve only menu items assigned to this outlet
router.get('/:outletId/menu', (req, res, next) =>
  assignmentController.getOutletMenu(req, res, next)
);

// Assign a single item to an outlet
router.post(
  '/:outletId/menu',
  validate({ body: assignMenuItemSchema }),
  (req, res, next) => assignmentController.assignMenuItem(req, res, next)
);

// Bulk assign items to an outlet
router.post(
  '/:outletId/menu/bulk',
  validate({ body: bulkAssignSchema }),
  (req, res, next) => assignmentController.bulkAssignMenuItems(req, res, next)
);

// Override menu price for an outlet
router.patch(
  '/:outletId/menu/:menuItemId/price',
  validate({ body: overridePriceSchema }),
  (req, res, next) => assignmentController.overridePrice(req, res, next)
);

// Unassign an item from an outlet
router.delete('/:outletId/menu/:menuItemId', (req, res, next) =>
  assignmentController.unassignMenuItem(req, res, next)
);

export default router;

