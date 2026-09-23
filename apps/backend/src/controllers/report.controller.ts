import { Request, Response, NextFunction } from 'express';
import { reportService } from '../services/report.service';
import { getParam } from '../utils/params';

export class ReportController {
  async getRevenueByOutlet(_req: Request, res: Response, next: NextFunction) {
    try {
      const data = await reportService.getRevenueByOutlet();
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async getTopSellingItemsByOutlet(req: Request, res: Response, next: NextFunction) {
    try {
      const outletId = getParam(req.params.outletId, 'outletId');
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 5;
      const data = await reportService.getTopSellingItemsByOutlet(outletId, limit);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async getTopSellingItems(req: Request, res: Response, next: NextFunction) {
    try {
      const outletId = req.query.outletId as string | undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 5;
      if (outletId) {
        const data = await reportService.getTopSellingItemsByOutlet(outletId, limit);
        res.json({ success: true, data });
      } else {
        const data = await reportService.getGlobalTopSellingItems(limit);
        res.json({ success: true, data });
      }
    } catch (error) {
      next(error);
    }
  }

  async getGlobalOverview(_req: Request, res: Response, next: NextFunction) {
    try {
      const data = await reportService.getGlobalOverview();
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }
}

export const reportController = new ReportController();

