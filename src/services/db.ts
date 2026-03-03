import { supabase } from '../lib/supabase';

export const db = {

  // ================= PRODUCTS =================
  products: {
    async getAll() {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name');
      if (error) throw error;
      return data || [];
    },

    async create(product: any) {
      const { data, error } = await supabase
        .from('products')
        .insert([{ ...product, stock: 0 }])
        .select();
      if (error) throw error;
      return data?.[0];
    },

    async update(id: number, updates: any) {
      const { data, error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', id)
        .select();
      if (error) throw error;
      return data?.[0];
    },

    async delete(id: number) {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return true;
    }
  },

  // ================= SUPPLIERS =================
  suppliers: {
    async getAll() {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('name');
      if (error) throw error;
      return data || [];
    }
  },

  // ================= CUSTOMERS =================
  customers: {
    async getAll() {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('name');
      if (error) throw error;
      return data || [];
    }
  },

  // ================= PURCHASES =================
  purchases: {
    async getAll() {
      const { data, error } = await supabase
        .from('purchases')
        .select('*, suppliers(name)')
        .order('date', { ascending: false });

      if (error) throw error;

      return (data || []).map((p: any) => ({
        ...p,
        supplier_name: p.suppliers?.name
      }));
    },

    async create(purchase: any, items: any[]) {
      const { data: purchaseData, error: pError } = await supabase
        .from('purchases')
        .insert([purchase])
        .select();

      if (pError) throw pError;
      const purchaseId = purchaseData![0].id;

      const itemsToInsert = items.map(item => ({
        ...item,
        purchase_id: purchaseId
      }));

      const { error: iError } = await supabase
        .from('purchase_items')
        .insert(itemsToInsert);

      if (iError) throw iError;

      for (const item of items) {
        const { error } = await supabase.rpc('increment_stock', {
          product_id: Number(item.product_id),
          amount: Number(item.quantity)
        });
        if (error) throw error;
      }

      return purchaseData![0];
    },

    async delete(id: number) {
      const { data: items } = await supabase
        .from('purchase_items')
        .select('*')
        .eq('purchase_id', id);

      for (const item of items || []) {
        await supabase.rpc('decrement_stock', {
          product_id: item.product_id,
          amount: item.quantity
        });
      }

      const { error } = await supabase
        .from('purchases')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    }
  },

  // ================= SALES =================
  sales: {
    async create(sale: any, items: any[]) {
      const { data: saleData, error: sError } = await supabase
        .from('sales')
        .insert([sale])
        .select();

      if (sError) throw sError;
      const saleId = saleData![0].id;

      const itemsToInsert = items.map(item => ({
        ...item,
        sale_id: saleId
      }));

      const { error: iError } = await supabase
        .from('sales_items')
        .insert(itemsToInsert);

      if (iError) throw iError;

      for (const item of items) {
        const { error } = await supabase.rpc('decrement_stock', {
          product_id: Number(item.product_id),
          amount: Number(item.quantity)
        });
        if (error) throw error;
      }

      return saleData![0];
    }
  },

  // ================= PRODUCTION =================
  production: {
    async getAll() {
      const { data, error } = await supabase
        .from('production')
        .select('*, preform:products!preform_product_id(name), bottle:products!bottle_product_id(name)')
        .order('date', { ascending: false });

      if (error) throw error;

      return (data || []).map((e: any) => ({
        ...e,
        preform_name: e.preform?.name,
        bottle_name: e.bottle?.name
      }));
    }
  },

  // ================= DASHBOARD =================
  dashboard: {

    async getStats() {
      const [
        { data: sales },
        { data: purchases },
        { data: production },
        { count: customerCount }
      ] = await Promise.all([
        supabase.from('sales').select('total_amount'),
        supabase.from('purchases').select('total_amount'),
        supabase.from('production').select('quantity'),
        supabase.from('customers').select('*', { count: 'exact', head: true })
      ]);

      const totalSales = (sales || []).reduce((sum: number, s: any) => sum + (s.total_amount || 0), 0);
      const totalPurchases = (purchases || []).reduce((sum: number, p: any) => sum + (p.total_amount || 0), 0);
      const totalProduction = (production || []).reduce((sum: number, p: any) => sum + (p.quantity || 0), 0);

      return {
        totalSales: `₹${totalSales.toLocaleString()}`,
        totalPurchases: `₹${totalPurchases.toLocaleString()}`,
        totalProduction: totalProduction.toLocaleString(),
        activeCustomers: (customerCount || 0).toString(),
        salesTrend: 'up',
        salesTrendVal: '+0%',
        purchaseTrend: 'up',
        purchaseTrendVal: '+0%',
        productionTrend: 'up',
        productionTrendVal: '+0%',
        customerTrend: 'up',
        customerTrendVal: '+0%',
      };
    },

    async getCharts() {
      const { data: salesData } = await supabase
        .from('sales')
        .select('date,total_amount')
        .order('date', { ascending: true })
        .limit(7);

      return {
        salesData: (salesData || []).map((s: any) => ({
          name: new Date(s.date).toLocaleDateString('en-IN', { month: 'short' }),
          sales: s.total_amount,
          purchases: 0
        })),
        topProducts: []
      };
    }
  }
};