import { Router } from 'express';
import { menuController } from '../controllers/menu.controller';
import { validate } from '../middlewares/validate';
import {
  createCategorySchema,
  createMenuItemSchema,
  updateMenuItemSchema,
} from '../validations';

const router = Router();

// Categories
router.get('/categories', (req, res, next) => menuController.getCategories(req, res, next));
router.post(
  '/categories',
  validate({ body: createCategorySchema }),
  (req, res, next) => menuController.createCategory(req, res, next)
);

// Master Menu Items
router.get('/items', (req, res, next) => menuController.getAllMenuItems(req, res, next));
router.get('/items/:id', (req, res, next) => menuController.getMenuItemById(req, res, next));
router.post(
  '/items',
  validate({ body: createMenuItemSchema }),
  (req, res, next) => menuController.createMenuItem(req, res, next)
);
router.patch(
  '/items/:id',
  validate({ body: updateMenuItemSchema }),
  (req, res, next) => menuController.updateMenuItem(req, res, next)
);
router.delete('/items/:id', (req, res, next) => menuController.deleteMenuItem(req, res, next));

export default router;

