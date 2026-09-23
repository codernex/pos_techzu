import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type {
  Outlet,
  Category,
  MenuItem,
  OutletMenuItem,
  InventoryItem,
  Sale,
  GlobalOverview,
  RevenueByOutlet,
  TopSellingItem,
} from '../services/api';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5006/api/v1';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export const posApi = createApi({
  reducerPath: 'posApi',
  baseQuery: fetchBaseQuery({ baseUrl: API_BASE }),
  tagTypes: ['Outlets', 'Menu', 'Categories', 'Assignments', 'Inventory', 'Sales', 'Reports'],
  endpoints: (builder) => ({
    // Outlets
    getOutlets: builder.query<Outlet[], void>({
      query: () => '/outlets',
      transformResponse: (response: ApiResponse<Outlet[]>) => response.data,
      providesTags: ['Outlets'],
    }),
    getOutletById: builder.query<Outlet, string>({
      query: (id) => `/outlets/${id}`,
      transformResponse: (response: ApiResponse<Outlet>) => response.data,
      providesTags: (_result, _error, id) => [{ type: 'Outlets', id }],
    }),
    createOutlet: builder.mutation<Outlet, Partial<Outlet>>({
      query: (body) => ({
        url: '/outlets',
        method: 'POST',
        body,
      }),
      transformResponse: (response: ApiResponse<Outlet>) => response.data,
      invalidatesTags: ['Outlets', 'Reports'],
    }),
    updateOutlet: builder.mutation<Outlet, { id: string; data: Partial<Outlet> }>({
      query: ({ id, data }) => ({
        url: `/outlets/${id}`,
        method: 'PATCH',
        body: data,
      }),
      transformResponse: (response: ApiResponse<Outlet>) => response.data,
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Outlets', id }, 'Outlets', 'Reports'],
    }),

    // Categories
    getCategories: builder.query<Category[], void>({
      query: () => '/menu/categories',
      transformResponse: (response: ApiResponse<Category[]>) => response.data,
      providesTags: ['Categories'],
    }),
    createCategory: builder.mutation<Category, { name: string; description?: string }>({
      query: (body) => ({
        url: '/menu/categories',
        method: 'POST',
        body,
      }),
      transformResponse: (response: ApiResponse<Category>) => response.data,
      invalidatesTags: ['Categories'],
    }),

    // Master Menu Items
    getMenuItems: builder.query<MenuItem[], { categoryId?: string; search?: string; isActive?: boolean } | void>({
      query: (params) => {
        const q = new URLSearchParams();
        if (params?.categoryId) q.append('categoryId', params.categoryId);
        if (params?.search) q.append('search', params.search);
        if (params?.isActive !== undefined) q.append('isActive', String(params.isActive));
        const qs = q.toString();
        return `/menu/items${qs ? `?${qs}` : ''}`;
      },
      transformResponse: (response: ApiResponse<MenuItem[]>) => response.data,
      providesTags: ['Menu'],
    }),
    createMenuItem: builder.mutation<MenuItem, any>({
      query: (body) => ({
        url: '/menu/items',
        method: 'POST',
        body,
      }),
      transformResponse: (response: ApiResponse<MenuItem>) => response.data,
      invalidatesTags: ['Menu', 'Assignments', 'Reports'],
    }),
    updateMenuItem: builder.mutation<MenuItem, { id: string; data: any }>({
      query: ({ id, data }) => ({
        url: `/menu/items/${id}`,
        method: 'PATCH',
        body: data,
      }),
      transformResponse: (response: ApiResponse<MenuItem>) => response.data,
      invalidatesTags: ['Menu', 'Assignments'],
    }),
    deleteMenuItem: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/menu/items/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Menu', 'Assignments', 'Reports'],
    }),

    // Outlet Menu & Assignments
    getOutletMenu: builder.query<
      OutletMenuItem[],
      { outletId: string; categoryId?: string; availableOnly?: boolean; search?: string }
    >({
      query: ({ outletId, categoryId, availableOnly, search }) => {
        const q = new URLSearchParams();
        if (categoryId) q.append('categoryId', categoryId);
        if (availableOnly) q.append('availableOnly', 'true');
        if (search) q.append('search', search);
        const qs = q.toString();
        return `/assignments/${outletId}/menu${qs ? `?${qs}` : ''}`;
      },
      transformResponse: (response: ApiResponse<OutletMenuItem[]>) => response.data,
      providesTags: (_result, _error, { outletId }) => [{ type: 'Assignments', id: outletId }],
    }),
    assignMenuItem: builder.mutation<
      any,
      { outletId: string; menuItemId: string; customPrice?: number | null; initialStock?: number }
    >({
      query: ({ outletId, ...body }) => ({
        url: `/assignments/${outletId}/menu`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_result, _error, { outletId }) => [
        { type: 'Assignments', id: outletId },
        { type: 'Inventory', id: outletId },
        'Reports',
      ],
    }),
    overridePrice: builder.mutation<
      any,
      { outletId: string; menuItemId: string; customPrice: number | null }
    >({
      query: ({ outletId, menuItemId, customPrice }) => ({
        url: `/assignments/${outletId}/menu/${menuItemId}/price`,
        method: 'PATCH',
        body: { customPrice },
      }),
      invalidatesTags: (_result, _error, { outletId }) => [{ type: 'Assignments', id: outletId }],
    }),
    unassignMenuItem: builder.mutation<any, { outletId: string; menuItemId: string }>({
      query: ({ outletId, menuItemId }) => ({
        url: `/assignments/${outletId}/menu/${menuItemId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, { outletId }) => [
        { type: 'Assignments', id: outletId },
        { type: 'Inventory', id: outletId },
      ],
    }),

    // Outlet Inventory
    getOutletInventory: builder.query<
      InventoryItem[],
      { outletId: string; lowStockOnly?: boolean; search?: string }
    >({
      query: ({ outletId, lowStockOnly, search }) => {
        const q = new URLSearchParams();
        if (lowStockOnly) q.append('lowStockOnly', 'true');
        if (search) q.append('search', search);
        const qs = q.toString();
        return `/inventory/${outletId}/inventory${qs ? `?${qs}` : ''}`;
      },
      transformResponse: (response: ApiResponse<InventoryItem[]>) => response.data,
      providesTags: (_result, _error, { outletId }) => [{ type: 'Inventory', id: outletId }],
    }),
    updateStock: builder.mutation<any, { outletId: string; menuItemId: string; quantity: number }>({
      query: ({ outletId, menuItemId, quantity }) => ({
        url: `/inventory/${outletId}/inventory/${menuItemId}`,
        method: 'PUT',
        body: { quantity },
      }),
      invalidatesTags: (_result, _error, { outletId }) => [
        { type: 'Inventory', id: outletId },
        { type: 'Assignments', id: outletId },
      ],
    }),
    restock: builder.mutation<any, { outletId: string; menuItemId: string; addedQuantity: number }>({
      query: ({ outletId, menuItemId, addedQuantity }) => ({
        url: `/inventory/${outletId}/inventory/${menuItemId}/restock`,
        method: 'POST',
        body: { addedQuantity },
      }),
      invalidatesTags: (_result, _error, { outletId }) => [
        { type: 'Inventory', id: outletId },
        { type: 'Assignments', id: outletId },
      ],
    }),

    // Sales & POS Transactions
    createSale: builder.mutation<
      Sale,
      {
        outletId: string;
        items: Array<{ menuItemId: string; quantity: number }>;
        paymentMethod?: string;
        cashierNote?: string;
        taxRate?: number;
      }
    >({
      query: ({ outletId, ...body }) => ({
        url: `/sales/${outletId}/sales`,
        method: 'POST',
        body,
      }),
      transformResponse: (response: ApiResponse<Sale>) => response.data,
      invalidatesTags: (_result, _error, { outletId }) => [
        { type: 'Inventory', id: outletId },
        { type: 'Assignments', id: outletId },
        'Sales',
        'Reports',
        'Outlets',
      ],
    }),
    getSalesByOutlet: builder.query<{ total: number; sales: Sale[] }, { outletId: string; limit?: number }>({
      query: ({ outletId, limit = 50 }) => `/sales/${outletId}/sales?limit=${limit}`,
      transformResponse: (response: ApiResponse<{ total: number; sales: Sale[] }>) => response.data,
      providesTags: ['Sales'],
    }),

    // Reports & Analytics
    getOverview: builder.query<GlobalOverview, void>({
      query: () => '/reports/overview',
      transformResponse: (response: ApiResponse<GlobalOverview>) => response.data,
      providesTags: ['Reports'],
    }),
    getRevenueByOutlet: builder.query<RevenueByOutlet[], void>({
      query: () => '/reports/revenue-by-outlet',
      transformResponse: (response: ApiResponse<RevenueByOutlet[]>) => response.data,
      providesTags: ['Reports'],
    }),
    getTopSellingItems: builder.query<TopSellingItem[], { outletId: string; limit?: number }>({
      query: ({ outletId, limit = 5 }) => `/reports/top-items/${outletId}?limit=${limit}`,
      transformResponse: (response: ApiResponse<TopSellingItem[]>) => response.data,
      providesTags: ['Reports'],
    }),
  }),
});

export const {
  useGetOutletsQuery,
  useGetOutletByIdQuery,
  useCreateOutletMutation,
  useUpdateOutletMutation,
  useGetCategoriesQuery,
  useCreateCategoryMutation,
  useGetMenuItemsQuery,
  useCreateMenuItemMutation,
  useUpdateMenuItemMutation,
  useDeleteMenuItemMutation,
  useGetOutletMenuQuery,
  useAssignMenuItemMutation,
  useOverridePriceMutation,
  useUnassignMenuItemMutation,
  useGetOutletInventoryQuery,
  useUpdateStockMutation,
  useRestockMutation,
  useCreateSaleMutation,
  useGetSalesByOutletQuery,
  useGetOverviewQuery,
  useGetRevenueByOutletQuery,
  useGetTopSellingItemsQuery,
} = posApi;

