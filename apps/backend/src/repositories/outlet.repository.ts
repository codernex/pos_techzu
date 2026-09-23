import { prisma } from '../config/prisma';
import { Prisma } from '@prisma/client';

export class OutletRepository {
  async findAll() {
    return prisma.outlet.findMany({
      include: {
        company: true,
        _count: {
          select: {
            outletMenuItems: true,
            inventories: true,
            sales: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string) {
    return prisma.outlet.findUnique({
      where: { id },
      include: {
        company: true,
        _count: {
          select: {
            outletMenuItems: true,
            inventories: true,
            sales: true,
          },
        },
      },
    });
  }

  async findByCode(code: string) {
    return prisma.outlet.findUnique({
      where: { code },
    });
  }

  async create(data: {
    companyId: string;
    name: string;
    code: string;
    address?: string;
    phone?: string;
  }) {
    return prisma.outlet.create({
      data: {
        companyId: data.companyId,
        name: data.name,
        code: data.code.toUpperCase(),
        address: data.address,
        phone: data.phone,
      },
      include: { company: true },
    });
  }

  async update(id: string, data: Partial<{
    name: string;
    code: string;
    address: string;
    phone: string;
    isActive: boolean;
  }>) {
    return prisma.outlet.update({
      where: { id },
      data: {
        ...data,
        ...(data.code ? { code: data.code.toUpperCase() } : {}),
      },
    });
  }

  /**
   * Atomic sequential receipt counter increment with row-level locking.
   * Runs inside an active Prisma interactive transaction (tx).
   */
  async incrementAndGetReceiptSequence(
    tx: Prisma.TransactionClient,
    outletId: string
  ): Promise<{ receiptSequence: number; outletCode: string }> {
    const result = await tx.$queryRaw<{ receiptCounter: number; code: string }[]>`
      UPDATE "Outlet"
      SET "receiptCounter" = "receiptCounter" + 1
      WHERE id = ${outletId}
      RETURNING "receiptCounter", "code"
    `;

    if (!result || result.length === 0) {
      throw new Error(`Outlet not found or locked: ${outletId}`);
    }

    return {
      receiptSequence: result[0].receiptCounter,
      outletCode: result[0].code,
    };
  }
}

export const outletRepository = new OutletRepository();

