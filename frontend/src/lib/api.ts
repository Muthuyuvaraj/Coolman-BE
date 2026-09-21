import type { Product } from "@/data/products";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export type ProductInput = Omit<Product, "id"> & { id?: string };
export type AdminProduct = Product & {
  stock: number;
  active: boolean;
  description: string;
  discountPrice?: number;
  colors: string[];
};

export type OrderInput = {
  customerName: string;
  customerEmail: string;
  phone: string;
  address: string;
  items: { productId: string; name: string; size: string; quantity: number; price: number }[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  couponCode?: string;
};

export type CreatedOrder = OrderInput & { orderId: string; trackingId: string; status: string; paymentStatus: string; createdAt?: string };
export type AdminOrder = CreatedOrder & { trackingId?: string; createdAt?: string };
export type AdminCustomer = { name: string; email: string; phone: string; totalOrders: number; totalSpent: number; status: string; createdAt?: string };
export type AdminCoupon = { code: string; discountType: string; discountValue: number; expiryDate: string; usageLimit: number; usedCount: number; active: boolean };
export type StoreSettings = { storeName: string; supportEmail: string; phone: string };
export type AdminAnalytics = { totalRevenue: number; totalOrders: number; pendingOrders: number; totalCustomers: number; lowStock: number; categoryShare: { name: string; value: number }[]; dailySales: { name: string; sales: number; orders: number }[] };
export type AdminNotification = { id: string; message: string; type: "order" | "stock" };

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || `Request failed with status ${response.status}`);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export function fetchProducts() {
  return request<Product[]>("/api/products");
}

export function fetchAdminProducts() {
  return request<AdminProduct[]>("/api/admin/products");
}

export function createProduct(product: AdminProduct) {
  return request<AdminProduct>("/api/admin/products", {
    method: "POST",
    body: JSON.stringify(product),
  });
}

export function updateProduct(productId: string, changes: Partial<AdminProduct>) {
  return request<AdminProduct>(`/api/admin/products/${productId}`, {
    method: "PATCH",
    body: JSON.stringify(changes),
  });
}

export function deleteProduct(productId: string) {
  return request<void>(`/api/admin/products/${productId}`, { method: "DELETE" });
}

export function createOrder(order: OrderInput) {
  return request<CreatedOrder>("/api/orders", { method: "POST", body: JSON.stringify(order) });
}

export function fetchCustomerOrders(email: string) {
  return request<AdminOrder[]>(`/api/orders/customer/${encodeURIComponent(email)}`);
}

export function fetchTrackedOrder(trackingId: string) {
  return request<AdminOrder>(`/api/orders/track/${encodeURIComponent(trackingId)}`);
}

export function fetchAdminOrders() { return request<AdminOrder[]>("/api/admin/orders"); }
export function updateAdminOrder(orderId: string, changes: { status?: string; trackingId?: string }) { return request<AdminOrder>(`/api/admin/orders/${orderId}`, { method: "PATCH", body: JSON.stringify(changes) }); }
export function fetchAdminCustomers() { return request<AdminCustomer[]>("/api/admin/customers"); }
export function createCustomer(customer: { name: string; email: string; phone: string }) { return request<AdminCustomer>("/api/customers", { method: "POST", body: JSON.stringify(customer) }); }
export function fetchAdminCoupons() { return request<AdminCoupon[]>("/api/admin/coupons"); }
export function createCoupon(coupon: Omit<AdminCoupon, "usedCount">) { return request<AdminCoupon>("/api/admin/coupons", { method: "POST", body: JSON.stringify(coupon) }); }
export function updateCoupon(code: string, active: boolean) { return request<AdminCoupon>(`/api/admin/coupons/${code}`, { method: "PATCH", body: JSON.stringify({ active }) }); }
export function fetchAdminSettings() { return request<StoreSettings>("/api/admin/settings"); }
export function updateAdminSettings(settings: StoreSettings) { return request<StoreSettings>("/api/admin/settings", { method: "PUT", body: JSON.stringify(settings) }); }
export function fetchAdminAnalytics() { return request<AdminAnalytics>("/api/admin/analytics"); }
export function fetchAdminNotifications() { return request<AdminNotification[]>("/api/admin/notifications"); }
