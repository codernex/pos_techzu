import { Request, Response, NextFunction } from 'express';
import { assignmentService } from '../services/assignment.service';
import { getParam } from '../utils/params';

export class AssignmentController {
  async getOutletMenu(req: Request, res: Response, next: NextFunction) {
    try {
      const outletId = getParam(req.params.outletId, 'outletId');
      const { categoryId, availableOnly, search } = req.query;
      const menu = await assignmentService.getOutletMenu(outletId, {
        categoryId: categoryId as string,
        availableOnly: availableOnly === 'true',
        search: search as string,
      });
      res.json({ success: true, data: menu });
    } catch (error) {
      next(error);
    }
  }

  async assignMenuItem(req: Request, res: Response, next: NextFunction) {
    try {
      const outletId = getParam(req.params.outletId, 'outletId');
      const assignment = await assignmentService.assignMenuItem({
        outletId,
        ...req.body,
      });
      res.status(201).json({ success: true, data: assignment });
    } catch (error) {
      next(error);
    }
  }

  async bulkAssignMenuItems(req: Request, res: Response, next: NextFunction) {
    try {
      const outletId = getParam(req.params.outletId, 'outletId');
      const assignments = await assignmentService.bulkAssignMenuItems(
        outletId,
        req.body.items
      );
      res.status(201).json({ success: true, data: assignments });
    } catch (error) {
      next(error);
    }
  }

  async overridePrice(req: Request, res: Response, next: NextFunction) {
    try {
      const outletId = getParam(req.params.outletId, 'outletId');
      const menuItemId = getParam(req.params.menuItemId, 'menuItemId');
      const assignment = await assignmentService.overridePrice(
        outletId,
        menuItemId,
        req.body.customPrice
      );
      res.json({ success: true, data: assignment });
    } catch (error) {
      next(error);
    }
  }

  async unassignMenuItem(req: Request, res: Response, next: NextFunction) {
    try {
      const outletId = getParam(req.params.outletId, 'outletId');
      const menuItemId = getParam(req.params.menuItemId, 'menuItemId');
      await assignmentService.unassignMenuItem(outletId, menuItemId);
      res.json({ success: true, message: 'Item unassigned from outlet successfully' });
    } catch (error) {
      next(error);
    }
  }
}

export const assignmentController = new AssignmentController();

