import { Request, Response, NextFunction } from 'express';
import { saleService } from '../services/sale.service';
import { getParam } from '../utils/params';

export class SaleController {
  async getSalesByOutlet(req: Request, res: Response, next: NextFunction) {
    try {
      const outletId = getParam(req.params.outletId, 'outletId');
      const { limit, offset, startDate, endDate } = req.query;
      const result = await saleService.getSalesByOutlet(outletId, {
        limit: limit ? parseInt(limit as string, 10) : undefined,
        offset: offset ? parseInt(offset as string, 10) : undefined,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
      });
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async getSaleById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = getParam(req.params.id, 'id');
      const sale = await saleService.getSaleById(id);
      res.json({ success: true, data: sale });
    } catch (error) {
      next(error);
    }
  }

  async getSaleByReceiptNumber(req: Request, res: Response, next: NextFunction) {
    try {
      const receiptNumber = getParam(req.params.receiptNumber, 'receiptNumber');
      const sale = await saleService.getSaleByReceiptNumber(receiptNumber);
      res.json({ success: true, data: sale });
    } catch (error) {
      next(error);
    }
  }

  async createSale(req: Request, res: Response, next: NextFunction) {
    try {
      const outletId = getParam(req.params.outletId, 'outletId');
      const sale = await saleService.createSale({
        outletId,
        ...req.body,
      });
      res.status(201).json({
        success: true,
        message: 'Sale transaction completed successfully',
        data: sale,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const saleController = new SaleController();

