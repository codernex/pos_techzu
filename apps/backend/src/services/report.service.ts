import { reportRepository } from '../repositories/report.repository';
import { outletRepository } from '../repositories/outlet.repository';
import { NotFoundError } from '../errors/AppError';
import { prisma } from '../config/prisma';

export class ReportService {
  async getRevenueByOutlet() {
    return reportRepository.getTotalRevenueByOutlet();
  }

  async getTopSellingItemsByOutlet(outletId: string, limit = 5) {
    const outlet = await outletRepository.findById(outletId);
    if (!outlet) {
      throw new NotFoundError(`Outlet with ID ${outletId} not found`);
    }

    return reportRepository.getTopSellingItemsByOutlet(outletId, limit);
  }

  async getGlobalTopSellingItems(limit = 5) {
    return reportRepository.getGlobalTopSellingItems(limit);
  }

  async getGlobalOverview() {
    const [revenueByOutlet, globalTopItems, totalOutlets, totalMenuItems, totalSalesCount] =
      await Promise.all([
        reportRepository.getTotalRevenueByOutlet(),
        reportRepository.getGlobalTopSellingItems(5),
        prisma.outlet.count(),
        prisma.menuItem.count(),
        prisma.sale.count(),
      ]);

    const totalRevenue = revenueByOutlet.reduce((acc, curr) => acc + curr.totalRevenue, 0);

    return {
      summary: {
        totalRevenue,
        totalSalesCount,
        totalOutlets,
        totalMenuItems,
      },
      revenueByOutlet,
      globalTopSellingItems: globalTopItems,
    };
  }
}

export const reportService = new ReportService();

