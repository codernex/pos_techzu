const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5006/api/v1';

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const response = await fetch(url, { ...options, headers });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || `Request failed with status ${response.status}`);
  }

  return data.data;
}

export interface Company {
  id: string;
  name: string;
  code: string;
}

export interface Outlet {
  id: string;
  companyId: string;
  name: string;
  code: string;
  address?: string;
  phone?: string;
  receiptCounter: number;
  isActive: boolean;
  company?: Company;
  _count?: {
    outletMenuItems: number;
    inventories: number;
    sales: number;
  };
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  _count?: { menuItems: number };
}

export interface MenuItem {
  id: string;
  companyId: string;
  categoryId: string;
  category?: Category;
  name: string;
  sku: string;
  description?: string;
  basePrice: string | number;
  imageUrl?: string;
  isActive: boolean;
  outletAssignments?: Array<{
    id: string;
    outletId: string;
    customPrice?: string | number | null;
    isAvailable: boolean;
    outlet: { id: string; name: string; code: string };
  }>;
}

export interface OutletMenuItem {
  assignmentId: string;
  outletId: string;
  menuItemId: string;
  name: string;
  sku: string;
  description?: string;
  imageUrl?: string;
  category: Category;
  basePrice: string | number;
  customPrice: string | number | null;
  effectivePrice: string | number;
  isAvailable: boolean;
  stock: number;
  lowStockThreshold: number;
  isLowStock: boolean;
  isOutOfStock: boolean;
}

export interface InventoryItem {
  id: string;
  outletId: string;
  menuItemId: string;
  name: string;
  sku: string;
  category: Category;
  basePrice: string | number;
  customPrice: string | number | null;
  effectivePrice: string | number;
  isAssigned: boolean;
  isAvailable: boolean;
  quantity: number;
  lowStockThreshold: number;
  isLowStock: boolean;
  isOutOfStock: boolean;
  updatedAt: string;
}

export interface Sale {
  id: string;
  outletId: string;
  receiptNumber: string;
  receiptSequence: number;
  subtotal: string | number;
  tax: string | number;
  totalAmount: string | number;
  paymentMethod: string;
  cashierNote?: string;
  status: string;
  createdAt: string;
  items: Array<{
    id: string;
    menuItemId: string;
    quantity: number;
    unitPrice: string | number;
    subtotal: string | number;
    menuItem: { name: string; sku: string };
  }>;
  outlet?: { name: string; code: string; address?: string; phone?: string };
}

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

export interface GlobalOverview {
  summary: {
    totalRevenue: number;
    totalSalesCount: number;
    totalOutlets: number;
    totalMenuItems: number;
  };
  revenueByOutlet: RevenueByOutlet[];
  globalTopSellingItems: TopSellingItem[];
}

export const api = {
  // Outlets
  getOutlets: () => request<Outlet[]>('/outlets'),
  getOutlet: (id: string) => request<Outlet>(`/outlets/${id}`),
  createOutlet: (data: Partial<Outlet>) =>
    request<Outlet>('/outlets', { method: 'POST', body: JSON.stringify(data) }),
  updateOutlet: (id: string, data: Partial<Outlet>) =>
    request<Outlet>(`/outlets/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  // Categories
  getCategories: () => request<Category[]>('/menu/categories'),
  createCategory: (data: { name: string; description?: string }) =>
    request<Category>('/menu/categories', { method: 'POST', body: JSON.stringify(data) }),

  // Menu Items
  getMenuItems: (params?: { categoryId?: string; search?: string; isActive?: boolean }) => {
    const q = new URLSearchParams();
    if (params?.categoryId) q.append('categoryId', params.categoryId);
    if (params?.search) q.append('search', params.search);
    if (params?.isActive !== undefined) q.append('isActive', String(params.isActive));
    return request<MenuItem[]>(`/menu/items?${q.toString()}`);
  },
  createMenuItem: (data: any) =>
    request<MenuItem>('/menu/items', { method: 'POST', body: JSON.stringify(data) }),
  updateMenuItem: (id: string, data: any) =>
    request<MenuItem>(`/menu/items/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteMenuItem: (id: string) =>
    request<{ message: string }>(`/menu/items/${id}`, { method: 'DELETE' }),

  // Assignments & Outlet Menu
  getOutletMenu: (outletId: string, params?: { categoryId?: string; availableOnly?: boolean; search?: string }) => {
    const q = new URLSearchParams();
    if (params?.categoryId) q.append('categoryId', params.categoryId);
    if (params?.availableOnly) q.append('availableOnly', 'true');
    if (params?.search) q.append('search', params.search);
    return request<OutletMenuItem[]>(`/assignments/${outletId}/menu?${q.toString()}`);
  },
  assignMenuItem: (outletId: string, data: { menuItemId: string; customPrice?: number | null; initialStock?: number }) =>
    request<any>(`/assignments/${outletId}/menu`, { method: 'POST', body: JSON.stringify(data) }),
  overridePrice: (outletId: string, menuItemId: string, customPrice: number | null) =>
    request<any>(`/assignments/${outletId}/menu/${menuItemId}/price`, {
      method: 'PATCH',
      body: JSON.stringify({ customPrice }),
    }),
  unassignMenuItem: (outletId: string, menuItemId: string) =>
    request<any>(`/assignments/${outletId}/menu/${menuItemId}`, { method: 'DELETE' }),

  // Inventory
  getOutletInventory: (outletId: string, params?: { lowStockOnly?: boolean; search?: string }) => {
    const q = new URLSearchParams();
    if (params?.lowStockOnly) q.append('lowStockOnly', 'true');
    if (params?.search) q.append('search', params.search);
    return request<InventoryItem[]>(`/inventory/${outletId}/inventory?${q.toString()}`);
  },
  updateStock: (outletId: string, menuItemId: string, quantity: number) =>
    request<any>(`/inventory/${outletId}/inventory/${menuItemId}`, {
      method: 'PUT',
      body: JSON.stringify({ quantity }),
    }),
  restock: (outletId: string, menuItemId: string, addedQuantity: number) =>
    request<any>(`/inventory/${outletId}/inventory/${menuItemId}/restock`, {
      method: 'POST',
      body: JSON.stringify({ addedQuantity }),
    }),

  // Sales & POS
  createSale: (
    outletId: string,
    payload: {
      items: Array<{ menuItemId: string; quantity: number }>;
      paymentMethod?: string;
      cashierNote?: string;
      taxRate?: number;
    }
  ) =>
    request<Sale>(`/sales/${outletId}/sales`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getSalesByOutlet: (outletId: string, limit = 50) =>
    request<{ total: number; sales: Sale[] }>(`/sales/${outletId}/sales?limit=${limit}`),

  // Reporting
  getRevenueByOutlet: () => request<RevenueByOutlet[]>('/reports/revenue-by-outlet'),
  getTopSellingItems: (outletId: string) => request<TopSellingItem[]>(`/reports/top-items/${outletId}`),
  getOverview: () => request<GlobalOverview>('/reports/overview'),
};

