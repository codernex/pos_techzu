import { saleRepository, CreateSaleParams } from '../repositories/sale.repository';
import { outletRepository } from '../repositories/outlet.repository';
import { BadRequestError, NotFoundError } from '../errors/AppError';

export class SaleService {
  async getSalesByOutlet(
    outletId: string,
    params?: { limit?: number; offset?: number; startDate?: Date; endDate?: Date }
  ) {
    const outlet = await outletRepository.findById(outletId);
    if (!outlet) {
      throw new NotFoundError(`Outlet with ID ${outletId} not found`);
    }

    return saleRepository.findByOutletId(outletId, params);
  }

  async getSaleById(id: string) {
    const sale = await saleRepository.findById(id);
    if (!sale) {
      throw new NotFoundError(`Sale with ID ${id} not found`);
    }
    return sale;
  }

  async getSaleByReceiptNumber(receiptNumber: string) {
    const sale = await saleRepository.findByReceiptNumber(receiptNumber);
    if (!sale) {
      throw new NotFoundError(`Receipt "${receiptNumber}" not found`);
    }
    return sale;
  }

  async createSale(params: CreateSaleParams) {
    if (!params.items || params.items.length === 0) {
      throw new BadRequestError('A sale must contain at least one item');
    }

    for (const item of params.items) {
      if (!item.quantity || item.quantity <= 0) {
        throw new BadRequestError(`Item quantity must be a positive integer`);
      }
    }

    const outlet = await outletRepository.findById(params.outletId);
    if (!outlet) {
      throw new NotFoundError(`Outlet with ID ${params.outletId} not found`);
    }
    if (!outlet.isActive) {
      throw new BadRequestError(`Outlet "${outlet.name}" is currently inactive`);
    }

    return saleRepository.createSaleTransaction(params);
  }
}

export const saleService = new SaleService();

