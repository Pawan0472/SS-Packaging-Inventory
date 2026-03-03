import { supabase, isSupabaseConfigured } from '../lib/supabase';

export const db = {

  // ================= PRODUCTS =================
  products: {
    async getAll() {
      if (!isSupabaseConfigured) return [];
      const { data, error } = await supabase!
        .from('products')
        .select('*')
        .order('name');
      if (error) throw error;
      return data;
    },

    async create(product: any) {
      if (!isSupabaseConfigured) return null;
      const { data, error } = await supabase!
        .from('products')
        .insert([{ ...product, stock: 0 }])
        .select();
      if (error) throw error;
      return data[0];
    },

    async update(id: number, updates: any) {
      if (!isSupabaseConfigured) return null;
      const { data, error } = await supabase!
        .from('products')
        .update(updates)
        .eq('id', id)
        .select();
      if (error) throw error;
      return data[0];
    },

    async delete(id: number) {
      if (!isSupabaseConfigured) return null;
      const { error } = await supabase!
        .from('products')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return true;
    }
  },

  // ================= PURCHASES =================
  purchases: {
    async getAll() {
      if (!isSupabaseConfigured) return [];
      const { data, error } = await supabase!
        .from('purchases')
        .select('*, suppliers(name)')
        .order('date', { ascending: false });

      if (error) throw error;

      return data.map((p: any) => ({
        ...p,
        supplier_name: p.suppliers?.name
      }));
    },

    async create(purchase: any, items: any[]) {
      if (!isSupabaseConfigured) return null;

      // 1️⃣ Insert Purchase
      const { data: purchaseData, error: pError } = await supabase!
        .from('purchases')
        .insert([purchase])
        .select();

      if (pError) throw pError;
      const purchaseId = purchaseData[0].id;

      // 2️⃣ Insert Items
      const itemsToInsert = items.map(item => ({
        ...item,
        purchase_id: purchaseId
      }));

      const { error: iError } = await supabase!
        .from('purchase_items')
        .insert(itemsToInsert);

      if (iError) throw iError;

      // 3️⃣ Update Stock SAFELY
      for (const item of items) {
        const { error } = await supabase!.rpc('increment_stock', {
          product_id: Number(item.product_id),
          amount: Number(item.quantity)
        });

        if (error) throw error;
      }

      return purchaseData[0];
    },

    async getById(id: number) {
      if (!isSupabaseConfigured) return null;

      const { data: purchase, error: pError } = await supabase!
        .from('purchases')
        .select('*, suppliers(name)')
        .eq('id', id)
        .single();

      if (pError) throw pError;

      const { data: items, error: iError } = await supabase!
        .from('purchase_items')
        .select('*, products(name)')
        .eq('purchase_id', id);

      if (iError) throw iError;

      return {
        ...purchase,
        supplier_name: purchase.suppliers?.name,
        items: items.map((item: any) => ({
          ...item,
          product_name: item.products?.name,
          total: item.quantity * item.rate
        }))
      };
    }
  },

  // ================= SALES =================
  sales: {
    async create(sale: any, items: any[]) {
      if (!isSupabaseConfigured) return null;

      const { data: saleData, error: sError } = await supabase!
        .from('sales')
        .insert([sale])
        .select();

      if (sError) throw sError;
      const saleId = saleData[0].id;

      const itemsToInsert = items.map(item => ({
        ...item,
        sale_id: saleId
      }));

      const { error: iError } = await supabase!
        .from('sales_items')
        .insert(itemsToInsert);

      if (iError) throw iError;

      for (const item of items) {
        const { error } = await supabase!.rpc('decrement_stock', {
          product_id: Number(item.product_id),
          amount: Number(item.quantity)
        });

        if (error) throw error;
      }

      return saleData[0];
    }
  }
};