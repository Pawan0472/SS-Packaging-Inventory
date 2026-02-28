import { supabase, isSupabaseConfigured } from '../lib/supabase';

export const db = {
  products: {
    async getAll() {
      if (!isSupabaseConfigured) return [];
      const { data, error } = await supabase!.from('products').select('*').order('name');
      if (error) throw error;
      return data;
    },
    async create(product: any) {
      if (!isSupabaseConfigured) return null;
      const { data, error } = await supabase!.from('products').insert([product]).select();
      if (error) throw error;
      return data[0];
    },
    async update(id: number, updates: any) {
      if (!isSupabaseConfigured) return null;
      const { data, error } = await supabase!.from('products').update(updates).eq('id', id).select();
      if (error) throw error;
      return data[0];
    },
    async delete(id: number) {
      if (!isSupabaseConfigured) return null;
      const { error } = await supabase!.from('products').delete().eq('id', id);
      if (error) throw error;
      return true;
    }
  },
  suppliers: {
    async getAll() {
      if (!isSupabaseConfigured) return [];
      const { data, error } = await supabase!.from('suppliers').select('*').order('name');
      if (error) throw error;
      return data;
    },
    async create(supplier: any) {
      if (!isSupabaseConfigured) return null;
      const { data, error } = await supabase!.from('suppliers').insert([supplier]).select();
      if (error) throw error;
      return data[0];
    },
    async update(id: number, updates: any) {
      if (!isSupabaseConfigured) return null;
      const { data, error } = await supabase!.from('suppliers').update(updates).eq('id', id).select();
      if (error) throw error;
      return data[0];
    },
    async delete(id: number) {
      if (!isSupabaseConfigured) return null;
      const { error } = await supabase!.from('suppliers').delete().eq('id', id);
      if (error) throw error;
      return true;
    }
  },
  customers: {
    async getAll() {
      if (!isSupabaseConfigured) return [];
      const { data, error } = await supabase!.from('customers').select('*').order('name');
      if (error) throw error;
      return data;
    },
    async create(customer: any) {
      if (!isSupabaseConfigured) return null;
      const { data, error } = await supabase!.from('customers').insert([customer]).select();
      if (error) throw error;
      return data[0];
    }
  },
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
      
      // 1. Create Purchase
      const { data: purchaseData, error: pError } = await supabase!
        .from('purchases')
        .insert([purchase])
        .select();
      
      if (pError) throw pError;
      const purchaseId = purchaseData[0].id;

      // 2. Create Items
      const itemsToInsert = items.map(item => ({
        ...item,
        purchase_id: purchaseId
      }));
      
      const { error: iError } = await supabase!
        .from('purchase_items')
        .insert(itemsToInsert);
      
      if (iError) throw iError;

      // 3. Update Stock (Simplified for now)
      for (const item of items) {
        await supabase!.rpc('increment_stock', { 
          product_id: item.product_id, 
          amount: item.quantity 
        });
      }

      return purchaseData[0];
    }
  },
  sales: {
    async getAll() {
      if (!isSupabaseConfigured) return [];
      const { data, error } = await supabase!
        .from('sales')
        .select('*, customers(name)')
        .order('date', { ascending: false });
      if (error) throw error;
      return data.map((s: any) => ({
        ...s,
        customer_name: s.customers?.name
      }));
    },
    async create(sale: any, items: any[]) {
      if (!isSupabaseConfigured) return null;
      
      // 1. Create Sale
      const { data: saleData, error: sError } = await supabase!
        .from('sales')
        .insert([sale])
        .select();
      
      if (sError) throw sError;
      const saleId = saleData[0].id;

      // 2. Create Items
      const itemsToInsert = items.map(item => ({
        ...item,
        sale_id: saleId
      }));
      
      const { error: iError } = await supabase!
        .from('sales_items')
        .insert(itemsToInsert);
      
      if (iError) throw iError;

      // 3. Update Stock
      for (const item of items) {
        await supabase!.rpc('decrement_stock', { 
          product_id: item.product_id, 
          amount: item.quantity 
        });
      }

      return saleData[0];
    }
  },
  production: {
    async getAll() {
      if (!isSupabaseConfigured) return [];
      const { data, error } = await supabase!
        .from('production')
        .select('*, preform:products!preform_product_id(name), bottle:products!bottle_product_id(name)')
        .order('date', { ascending: false });
      if (error) throw error;
      return data.map((e: any) => ({
        ...e,
        preform_name: e.preform?.name,
        bottle_name: e.bottle?.name
      }));
    },
    async create(entry: any) {
      if (!isSupabaseConfigured) return null;
      
      const { data, error } = await supabase!
        .from('production')
        .insert([entry])
        .select();
      
      if (error) throw error;

      // Update Stock
      await supabase!.rpc('decrement_stock', { 
        product_id: entry.preform_product_id, 
        amount: entry.quantity 
      });
      await supabase!.rpc('increment_stock', { 
        product_id: entry.bottle_product_id, 
        amount: entry.quantity 
      });

      return data[0];
    }
  }
};
