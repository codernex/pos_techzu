import { Router } from 'express';
import { outletController } from '../controllers/outlet.controller';
import { validate } from '../middlewares/validate';
import { createOutletSchema, updateOutletSchema } from '../validations';

const router = Router();

router.get('/', (req, res, next) => outletController.getAllOutlets(req, res, next));
router.get('/:id', (req, res, next) => outletController.getOutletById(req, res, next));
router.post(
  '/',
  validate({ body: createOutletSchema }),
  (req, res, next) => outletController.createOutlet(req, res, next)
);
router.patch(
  '/:id',
  validate({ body: updateOutletSchema }),
  (req, res, next) => outletController.updateOutlet(req, res, next)
);

export default router;

