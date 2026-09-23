import { prisma } from '../config/prisma';

export interface RevenueByOutlet {
  outletId: string;
  outletName: string;
  outletCode: string;
  totalRevenue: number;
  totalTransactions: number;
}

export interface TopSellingItem {
  menuItemId: string;
  itemName: string;
  sku: string;
  totalQuantitySold: number;
  totalRevenue: number;
}

export class ReportRepository {
  /**
   * Total revenue aggregated by outlet.
   */
  async getTotalRevenueByOutlet(): Promise<RevenueByOutlet[]> {
    const rawData = await prisma.$queryRaw<
      Array<{
        outlet_id: string;
        outlet_name: string;
        outlet_code: string;
        total_revenue: string | number | null;
        total_transactions: string | number;
      }>
    >`
      SELECT 
        o.id AS outlet_id,
        o.name AS outlet_name,
        o.code AS outlet_code,
        COALESCE(SUM(s."totalAmount"), 0) AS total_revenue,
        COUNT(s.id) AS total_transactions
      FROM "Outlet" o
      LEFT JOIN "Sale" s ON s."outletId" = o.id AND s.status = 'COMPLETED'
      GROUP BY o.id, o.name, o.code
      ORDER BY total_revenue DESC;
    `;

    return rawData.map((row) => ({
      outletId: row.outlet_id,
      outletName: row.outlet_name,
      outletCode: row.outlet_code,
      totalRevenue: Number(row.total_revenue ?? 0),
      totalTransactions: Number(row.total_transactions ?? 0),
    }));
  }

  /**
   * Top 5 selling items per outlet (or for a specific outlet).
   */
  async getTopSellingItemsByOutlet(outletId: string, limit = 5): Promise<TopSellingItem[]> {
    const rawData = await prisma.$queryRaw<
      Array<{
        menu_item_id: string;
        item_name: string;
        sku: string;
        total_quantity_sold: string | number;
        total_revenue: string | number;
      }>
    >`
      SELECT 
        m.id AS menu_item_id,
        m.name AS item_name,
        m.sku AS sku,
        COALESCE(SUM(si.quantity), 0) AS total_quantity_sold,
        COALESCE(SUM(si.subtotal), 0) AS total_revenue
      FROM "SaleItem" si
      JOIN "Sale" s ON s.id = si."saleId"
      JOIN "MenuItem" m ON m.id = si."menuItemId"
      WHERE s."outletId" = ${outletId} AND s.status = 'COMPLETED'
      GROUP BY m.id, m.name, m.sku
      ORDER BY total_quantity_sold DESC, total_revenue DESC
      LIMIT ${limit};
    `;

    return rawData.map((row) => ({
      menuItemId: row.menu_item_id,
      itemName: row.item_name,
      sku: row.sku,
      totalQuantitySold: Number(row.total_quantity_sold ?? 0),
      totalRevenue: Number(row.total_revenue ?? 0),
    }));
  }

  /**
   * System-wide top selling items across all outlets.
   */
  async getGlobalTopSellingItems(limit = 5): Promise<TopSellingItem[]> {
    const rawData = await prisma.$queryRaw<
      Array<{
        menu_item_id: string;
        item_name: string;
        sku: string;
        total_quantity_sold: string | number;
        total_revenue: string | number;
      }>
    >`
      SELECT 
        m.id AS menu_item_id,
        m.name AS item_name,
        m.sku AS sku,
        COALESCE(SUM(si.quantity), 0) AS total_quantity_sold,
        COALESCE(SUM(si.subtotal), 0) AS total_revenue
      FROM "SaleItem" si
      JOIN "Sale" s ON s.id = si."saleId"
      JOIN "MenuItem" m ON m.id = si."menuItemId"
      WHERE s.status = 'COMPLETED'
      GROUP BY m.id, m.name, m.sku
      ORDER BY total_quantity_sold DESC, total_revenue DESC
      LIMIT ${limit};
    `;

    return rawData.map((row) => ({
      menuItemId: row.menu_item_id,
      itemName: row.item_name,
      sku: row.sku,
      totalQuantitySold: Number(row.total_quantity_sold ?? 0),
      totalRevenue: Number(row.total_revenue ?? 0),
    }));
  }
}

export const reportRepository = new ReportRepository();

