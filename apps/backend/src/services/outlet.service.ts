import { outletRepository } from '../repositories/outlet.repository';
import { ConflictError, NotFoundError } from '../errors/AppError';
import { prisma } from '../config/prisma';

export class OutletService {
  async getAllOutlets() {
    return outletRepository.findAll();
  }

  async getOutletById(id: string) {
    const outlet = await outletRepository.findById(id);
    if (!outlet) {
      throw new NotFoundError(`Outlet with ID ${id} not found`);
    }
    return outlet;
  }

  async createOutlet(data: {
    name: string;
    code: string;
    address?: string;
    phone?: string;
    companyId?: string;
  }) {
    // Verify unique code
    const existing = await outletRepository.findByCode(data.code);
    if (existing) {
      throw new ConflictError(`Outlet with code ${data.code} already exists`);
    }

    // Default company if not provided
    let companyId = data.companyId;
    if (!companyId) {
      const company = await prisma.company.findFirst();
      if (!company) {
        throw new NotFoundError('No company found. Please seed or create a company first.');
      }
      companyId = company.id;
    }

    return outletRepository.create({
      companyId,
      name: data.name,
      code: data.code,
      address: data.address,
      phone: data.phone,
    });
  }

  async updateOutlet(
    id: string,
    data: Partial<{
      name: string;
      code: string;
      address: string;
      phone: string;
      isActive: boolean;
    }>
  ) {
    await this.getOutletById(id);

    if (data.code) {
      const existing = await outletRepository.findByCode(data.code);
      if (existing && existing.id !== id) {
        throw new ConflictError(`Outlet with code ${data.code} already exists`);
      }
    }

    return outletRepository.update(id, data);
  }
}

export const outletService = new OutletService();

