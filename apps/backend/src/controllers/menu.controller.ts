import { Request, Response, NextFunction } from 'express';
import { menuService } from '../services/menu.service';
import { getParam } from '../utils/params';

export class MenuController {
  async getCategories(_req: Request, res: Response, next: NextFunction) {
    try {
      const categories = await menuService.getCategories();
      res.json({ success: true, data: categories });
    } catch (error) {
      next(error);
    }
  }

  async createCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const category = await menuService.createCategory(req.body);
      res.status(201).json({ success: true, data: category });
    } catch (error) {
      next(error);
    }
  }

  async getAllMenuItems(req: Request, res: Response, next: NextFunction) {
    try {
      const { categoryId, search, isActive } = req.query;
      const items = await menuService.getAllMenuItems({
        categoryId: categoryId as string,
        search: search as string,
        isActive: isActive !== undefined ? isActive === 'true' : undefined,
      });
      res.json({ success: true, data: items });
    } catch (error) {
      next(error);
    }
  }

  async getMenuItemById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = getParam(req.params.id, 'id');
      const item = await menuService.getMenuItemById(id);
      res.json({ success: true, data: item });
    } catch (error) {
      next(error);
    }
  }

  async createMenuItem(req: Request, res: Response, next: NextFunction) {
    try {
      const item = await menuService.createMenuItem(req.body);
      res.status(201).json({ success: true, data: item });
    } catch (error) {
      next(error);
    }
  }

  async updateMenuItem(req: Request, res: Response, next: NextFunction) {
    try {
      const id = getParam(req.params.id, 'id');
      const item = await menuService.updateMenuItem(id, req.body);
      res.json({ success: true, data: item });
    } catch (error) {
      next(error);
    }
  }

  async deleteMenuItem(req: Request, res: Response, next: NextFunction) {
    try {
      const id = getParam(req.params.id, 'id');
      await menuService.deleteMenuItem(id);
      res.json({ success: true, message: 'Menu item deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}

export const menuController = new MenuController();

