import { Router } from 'express';
import { saleController } from '../controllers/sale.controller';
import { validate } from '../middlewares/validate';
import { createSaleSchema } from '../validations';

const router = Router();

// Create sale for an outlet
router.post(
  '/:outletId/sales',
  validate({ body: createSaleSchema }),
  (req, res, next) => saleController.createSale(req, res, next)
);

// List sales for an outlet
router.get('/:outletId/sales', (req, res, next) =>
  saleController.getSalesByOutlet(req, res, next)
);

// Get sale by ID
router.get('/detail/:id', (req, res, next) =>
  saleController.getSaleById(req, res, next)
);

// Get sale by receipt number
router.get('/receipt/:receiptNumber', (req, res, next) =>
  saleController.getSaleByReceiptNumber(req, res, next)
);

export default router;

