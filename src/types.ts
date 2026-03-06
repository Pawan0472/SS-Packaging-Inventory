export type UserRole = 'superadmin' | 'admin' | 'manager' | 'staff';

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  permissions?: string[]; // List of module names the user can access
}

export interface Product {
  id: number;
  name: string;
  category: string;
  gram_weight: string;
  price: number;
  stock: number;
  min_stock_level: number;
  is_deleted: boolean;
  created_at: string;
}

export interface Supplier {
  id: number;
  name: string;
  contact_person: string;
  email: string;
  phone: string;
  address: string;
  is_deleted: boolean;
  created_at: string;
}

export interface Customer {
  id: number;
  name: string;
  contact_person: string;
  email: string;
  phone: string;
  address: string;
  is_deleted: boolean;
  created_at: string;
}

export interface Purchase {
  id: number;
  invoice_number: string;
  date: string;
  supplier_id: number;
  total_amount: number;
  transport_cost: number;
  is_deleted: boolean;
  created_at: string;
  supplier_name?: string;
}

export interface PurchaseItem {
  id: number;
  purchase_id: number;
  product_id: number;
  quantity: number;
  rate: number;
  product_name?: string;
  total?: number;
}

export interface Sale {
  id: number;
  invoice_number: string;
  date: string;
  customer_id: number;
  total_amount: number;
  transport_cost: number;
  is_deleted: boolean;
  created_at: string;
  customer_name?: string;
}

export interface SaleItem {
  id: number;
  sale_id: number;
  product_id: number;
  quantity: number;
  rate: number;
  product_name?: string;
  total?: number;
}

export interface Production {
  id: number;
  date: string;
  preform_product_id: number;
  bottle_product_id: number;
  quantity: number;
  is_deleted: boolean;
  created_at: string;
  preform_name?: string;
  bottle_name?: string;
}

export interface AuditLog {
  id: number;
  user_email: string;
  action: string;
  module: string;
  record_id: string;
  timestamp: string;
}
