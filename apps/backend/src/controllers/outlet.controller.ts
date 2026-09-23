import { Request, Response, NextFunction } from 'express';
import { outletService } from '../services/outlet.service';
import { getParam } from '../utils/params';

export class OutletController {
  async getAllOutlets(_req: Request, res: Response, next: NextFunction) {
    try {
      const outlets = await outletService.getAllOutlets();
      res.json({ success: true, data: outlets });
    } catch (error) {
      next(error);
    }
  }

  async getOutletById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = getParam(req.params.id, 'id');
      const outlet = await outletService.getOutletById(id);
      res.json({ success: true, data: outlet });
    } catch (error) {
      next(error);
    }
  }

  async createOutlet(req: Request, res: Response, next: NextFunction) {
    try {
      const outlet = await outletService.createOutlet(req.body);
      res.status(201).json({ success: true, data: outlet });
    } catch (error) {
      next(error);
    }
  }

  async updateOutlet(req: Request, res: Response, next: NextFunction) {
    try {
      const id = getParam(req.params.id, 'id');
      const outlet = await outletService.updateOutlet(id, req.body);
      res.json({ success: true, data: outlet });
    } catch (error) {
      next(error);
    }
  }
}

export const outletController = new OutletController();

