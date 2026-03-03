import { supabase } from '../lib/supabase';

export const db = {

  // ================= AUDIT =================
  audit: {
    async log(user_email: string, action: string, module: string, record_id: number) {
      await supabase.from('audit_logs').insert([
        { user_email, action, module, record_id }
      ]);
    }
  },

  // ================= PRODUCTS =================
  products: {
    async getAll() {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name');

      if (error) throw error;
      return data;
    }
  },

  // ================= PURCHASES =================
  purchases: {

    async getAll() {
      const { data, error } = await supabase
        .from('purchases')
        .select('*, suppliers(name)')
        .eq('is_deleted', false)
        .order('date', { ascending: false });

      if (error) throw error;

      return data.map((p: any) => ({
        ...p,
        supplier_name: p.suppliers?.name
      }));
    },

    async getById(id: number) {
      const { data: purchase, error: pError } = await supabase
        .from('purchases')
        .select('*, suppliers(name)')
        .eq('id', id)
        .single();

      if (pError) throw pError;

      const { data: items, error: iError } = await supabase
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
    },

    async create(purchase: any, items: any[]) {

      const { data: purchaseData, error: pError } = await supabase
        .from('purchases')
        .insert([{ ...purchase, is_deleted: false }])
        .select();

      if (pError) throw pError;

      const purchaseId = purchaseData[0].id;

      const itemsToInsert = items.map(item => ({
        ...item,
        purchase_id: purchaseId
      }));

      await supabase.from('purchase_items').insert(itemsToInsert);

      for (const item of items) {
        await supabase.rpc('increment_stock', {
          product_id: item.product_id,
          amount: item.quantity
        });
      }

      return purchaseData[0];
    },

    async softDelete(id: number, userEmail: string) {

      // Reverse stock
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

      // Mark as deleted
      await supabase
        .from('purchases')
        .update({ is_deleted: true })
        .eq('id', id);

      await db.audit.log(userEmail, 'SOFT_DELETE', 'PURCHASE', id);

      return true;
    }
  },

  // ================= SALES =================
  sales: {

    async getAll() {
      const { data, error } = await supabase
        .from('sales')
        .select('*, customers(name)')
        .eq('is_deleted', false)
        .order('date', { ascending: false });

      if (error) throw error;

      return data.map((s: any) => ({
        ...s,
        customer_name: s.customers?.name
      }));
    },

    async softDelete(id: number, userEmail: string) {

      const { data: items } = await supabase
        .from('sales_items')
        .select('*')
        .eq('sale_id', id);

      for (const item of items || []) {
        await supabase.rpc('increment_stock', {
          product_id: item.product_id,
          amount: item.quantity
        });
      }

      await supabase
        .from('sales')
        .update({ is_deleted: true })
        .eq('id', id);

      await db.audit.log(userEmail, 'SOFT_DELETE', 'SALE', id);

      return true;
    }
  },

  // ================= PRODUCTION =================
  production: {

    async getAll() {
      const { data, error } = await supabase
        .from('production')
        .select('*')
        .eq('is_deleted', false)
        .order('date', { ascending: false });

      if (error) throw error;
      return data;
    },

    async softDelete(id: number, userEmail: string) {

      const { data: entry } = await supabase
        .from('production')
        .select('*')
        .eq('id', id)
        .single();

      if (!entry) throw new Error('Production not found');

      await supabase.rpc('increment_stock', {
        product_id: entry.preform_product_id,
        amount: entry.quantity
      });

      await supabase.rpc('decrement_stock', {
        product_id: entry.bottle_product_id,
        amount: entry.quantity
      });

      await supabase
        .from('production')
        .update({ is_deleted: true })
        .eq('id', id);

      await db.audit.log(userEmail, 'SOFT_DELETE', 'PRODUCTION', id);

      return true;
    }
  }
};