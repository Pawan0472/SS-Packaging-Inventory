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
    },
    async update(id: number, updates: any) {
      if (!isSupabaseConfigured) return null;
      const { data, error } = await supabase!.from('customers').update(updates).eq('id', id).select();
      if (error) throw error;
      return data[0];
    },
    async delete(id: number) {
      if (!isSupabaseConfigured) return null;
      const { error } = await supabase!.from('customers').delete().eq('id', id);
      if (error) throw error;
      return true;
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

      // 3. Update Stock
      for (const item of items) {
        await supabase!.rpc('increment_stock', { 
          product_id: parseInt(item.product_id), 
          amount: parseInt(item.quantity)
        });
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
          product_id: parseInt(item.product_id), 
          amount: parseInt(item.quantity)
        });
      }

      return saleData[0];
    },
    async getById(id: number) {
      if (!isSupabaseConfigured) return null;
      const { data: sale, error: sError } = await supabase!
        .from('sales')
        .select('*, customers(name)')
        .eq('id', id)
        .single();
      
      if (sError) throw sError;

      const { data: items, error: iError } = await supabase!
        .from('sales_items')
        .select('*, products(name)')
        .eq('sale_id', id);
      
      if (iError) throw iError;

      return {
        ...sale,
        customer_name: sale.customers?.name,
        items: items.map((item: any) => ({
          ...item,
          product_name: item.products?.name,
          total: item.quantity * item.rate
        }))
      };
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
  },
  reports: {
    async getStockReport() {
      if (!isSupabaseConfigured) return [];
      const { data, error } = await supabase!.from('products').select('*').order('name');
      if (error) throw error;
      return data.map((p: any) => ({
        ...p,
        current_stock: p.stock,
        is_low_stock: (p.stock || 0) < (p.min_stock_level || 0)
      }));
    },
    async getProfitLossReport(startDate: string, endDate: string) {
      if (!isSupabaseConfigured) return { summary: { totalGrossProfit: 0, totalTransportCost: 0, totalNetProfit: 0 }, items: [] };
      
      // This is a simplified version. In a real app, you'd do complex joins or a database function.
      const { data: sales, error: sError } = await supabase!
        .from('sales')
        .select('*, sales_items(*, products(*))')
        .gte('date', startDate)
        .lte('date', endDate);
      
      if (sError) throw sError;

      let totalGrossProfit = 0;
      let totalTransportCost = 0;
      const items: any[] = [];

      sales.forEach((sale: any) => {
        totalTransportCost += sale.transport_cost || 0;
        sale.sales_items.forEach((item: any) => {
          const gross = (item.rate - (item.products?.price || 0)) * item.quantity;
          totalGrossProfit += gross;
          items.push({
            date: sale.date,
            product_name: item.products?.name,
            rate: item.rate,
            last_purchase_rate: item.products?.price,
            gross_profit: gross,
            net_profit: gross - (sale.transport_cost / sale.sales_items.length)
          });
        });
      });

      return {
        summary: {
          totalGrossProfit,
          totalTransportCost,
          totalNetProfit: totalGrossProfit - totalTransportCost
        },
        items
      };
    }
  },
  dashboard: {
    async getStats() {
      if (!isSupabaseConfigured) return null;

      const [
        { data: sales },
        { data: purchases },
        { data: production },
        { data: customers }
      ] = await Promise.all([
        supabase!.from('sales').select('total_amount'),
        supabase!.from('purchases').select('total_amount'),
        supabase!.from('production').select('quantity'),
        supabase!.from('customers').select('id', { count: 'exact' })
      ]);

      const totalSales = (sales || []).reduce((sum, s) => sum + (s.total_amount || 0), 0);
      const totalPurchases = (purchases || []).reduce((sum, p) => sum + (p.total_amount || 0), 0);
      const totalProduction = (production || []).reduce((sum, p) => sum + (p.quantity || 0), 0);
      const activeCustomers = customers?.length || 0;

      return {
        totalSales: `₹${totalSales.toLocaleString()}`,
        totalPurchases: `₹${totalPurchases.toLocaleString()}`,
        totalProduction: totalProduction.toLocaleString(),
        activeCustomers: activeCustomers.toString(),
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
      if (!isSupabaseConfigured) return null;

      // Simplified chart data
      return {
        salesData: [
          { name: 'Jan', sales: 4000, purchases: 2400 },
          { name: 'Feb', sales: 3000, purchases: 1398 },
          { name: 'Mar', sales: 2000, purchases: 9800 },
          { name: 'Apr', sales: 2780, purchases: 3908 },
          { name: 'May', sales: 1890, purchases: 4800 },
          { name: 'Jun', sales: 2390, purchases: 3800 },
          { name: 'Jul', sales: 3490, purchases: 4300 },
        ],
        topProducts: [
          { name: '500ml Bottle', value: 450, color: '#6366f1' },
          { name: '1L Preform', value: 320, color: '#8b5cf6' },
          { name: '2L Bottle', value: 280, color: '#ec4899' },
          { name: 'Cap 28mm', value: 210, color: '#f43f5e' },
        ]
      };
    }
  }
};
