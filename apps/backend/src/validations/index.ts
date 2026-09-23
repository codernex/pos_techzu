import { z } from 'zod';

export const createOutletSchema = z.object({
  name: z.string().min(1, 'Outlet name is required').max(100),
  code: z.string().min(2, 'Outlet code must be at least 2 characters').max(10),
  address: z.string().optional(),
  phone: z.string().optional(),
  companyId: z.string().uuid().optional(),
});

export const updateOutletSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  code: z.string().min(2).max(10).optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const createCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(50),
  description: z.string().optional(),
});

export const createMenuItemSchema = z.object({
  name: z.string().min(1, 'Menu item name is required').max(100),
  sku: z.string().min(2, 'SKU must be at least 2 characters').max(30),
  categoryId: z.string().uuid('Valid Category ID is required'),
  basePrice: z.coerce.number().positive('Base price must be positive'),
  description: z.string().optional(),
  imageUrl: z.string().url().optional().or(z.literal('')),
  isActive: z.boolean().optional(),
});

export const updateMenuItemSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  sku: z.string().min(2).max(30).optional(),
  categoryId: z.string().uuid().optional(),
  basePrice: z.coerce.number().positive().optional(),
  description: z.string().optional(),
  imageUrl: z.string().url().optional().or(z.literal('')),
  isActive: z.boolean().optional(),
});

export const assignMenuItemSchema = z.object({
  menuItemId: z.string().uuid('Valid Menu Item ID is required'),
  customPrice: z.coerce.number().positive().nullable().optional(),
  isAvailable: z.boolean().optional(),
  initialStock: z.coerce.number().int().min(0).optional(),
});

export const bulkAssignSchema = z.object({
  items: z
    .array(
      z.object({
        menuItemId: z.string().uuid(),
        customPrice: z.coerce.number().positive().nullable().optional(),
        isAvailable: z.boolean().optional(),
        initialStock: z.coerce.number().int().min(0).optional(),
      })
    )
    .min(1, 'At least one item must be provided for assignment'),
});

export const overridePriceSchema = z.object({
  customPrice: z.coerce.number().positive('Price must be greater than 0').nullable(),
});

export const updateStockSchema = z.object({
  quantity: z.coerce.number().int().min(0, 'Quantity cannot be negative'),
});

export const restockSchema = z.object({
  addedQuantity: z.coerce.number().int().positive('Added quantity must be positive'),
});

export const createSaleSchema = z.object({
  items: z
    .array(
      z.object({
        menuItemId: z.string().uuid('Valid Menu Item ID is required'),
        quantity: z.coerce.number().int().positive('Quantity must be at least 1'),
      })
    )
    .min(1, 'Sale must contain at least one item'),
  paymentMethod: z.enum(['CASH', 'CARD', 'QRIS', 'OTHER']).default('CASH'),
  cashierNote: z.string().optional(),
  taxRate: z.coerce.number().min(0).max(1).optional(),
});

