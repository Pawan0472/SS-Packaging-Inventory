import { supabase, isSupabaseConfigured } from '../lib/supabase';

const logAction = async (userEmail: string, action: string, module: string, recordId: string) => {
  if (!isSupabaseConfigured) return;
  try {
    await supabase!.from('audit_logs').insert([{
      user_email: userEmail,
      action,
      module,
      record_id: recordId,
      timestamp: new Date().toISOString()
    }]);
  } catch (e) {
    console.error('Failed to log action', e);
  }
};

const getLocalStorage = (key: string) => {
  const data = localStorage.getItem(`erp_${key}`);
  return data ? JSON.parse(data) : [];
};

const setLocalStorage = (key: string, data: any) => {
  localStorage.setItem(`erp_${key}`, JSON.stringify(data));
};

const safeCall = async (supabaseCall: () => Promise<any>, localStorageKey: string, filterFn?: (item: any) => boolean) => {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabaseCall();
      if (!error && data) return data;
      console.warn(`Supabase call for ${localStorageKey} failed, falling back to local storage`, error);
    } catch (e) {
      console.warn(`Supabase connection for ${localStorageKey} failed, falling back to local storage`, e);
    }
  }
  const data = getLocalStorage(localStorageKey);
  return filterFn ? data.filter(filterFn) : data;
};

export const db = {
  products: {
    async getAll() {
      return safeCall(
        async () => await supabase!.from('products').select('*').eq('is_deleted', false).order('name'),
        'products',
        (p: any) => !p.is_deleted
      );
    },
    async create(product: any, userEmail: string) {
      if (!isSupabaseConfigured) {
        const products = getLocalStorage('products');
        const newProduct = { ...product, id: Date.now(), is_deleted: false, stock: 0 };
        products.push(newProduct);
        setLocalStorage('products', products);
        return newProduct;
      }
      const { data, error } = await supabase!.from('products').insert([product]).select();
      if (error) throw error;
      await logAction(userEmail, 'CREATE', 'products', data[0].id.toString());
      return data[0];
    },
    async update(id: number, updates: any, userEmail: string) {
      if (!isSupabaseConfigured) {
        const products = getLocalStorage('products');
        const index = products.findIndex((p: any) => p.id === id);
        if (index !== -1) {
          products[index] = { ...products[index], ...updates };
          setLocalStorage('products', products);
          return products[index];
        }
        return null;
      }
      const { data, error } = await supabase!.from('products').update(updates).eq('id', id).select();
      if (error) throw error;
      await logAction(userEmail, 'UPDATE', 'products', id.toString());
      return data[0];
    },
    async softDelete(id: number, userEmail: string) {
      if (!isSupabaseConfigured) {
        const products = getLocalStorage('products');
        const index = products.findIndex((p: any) => p.id === id);
        if (index !== -1) {
          products[index].is_deleted = true;
          setLocalStorage('products', products);
          return true;
        }
        return false;
      }
      const { error } = await supabase!.from('products').update({ is_deleted: true }).eq('id', id);
      if (error) throw error;
      await logAction(userEmail, 'DELETE', 'products', id.toString());
      return true;
    }
  },
  suppliers: {
    async getAll() {
      return safeCall(
        async () => await supabase!.from('suppliers').select('*').eq('is_deleted', false).order('name'),
        'suppliers',
        (s: any) => !s.is_deleted
      );
    },
    async create(supplier: any, userEmail: string) {
      if (!isSupabaseConfigured) {
        const items = getLocalStorage('suppliers');
        const newItem = { ...supplier, id: Date.now(), is_deleted: false };
        items.push(newItem);
        setLocalStorage('suppliers', items);
        return newItem;
      }
      const { data, error } = await supabase!.from('suppliers').insert([supplier]).select();
      if (error) throw error;
      await logAction(userEmail, 'CREATE', 'suppliers', data[0].id.toString());
      return data[0];
    },
    async update(id: number, updates: any, userEmail: string) {
      if (!isSupabaseConfigured) {
        const items = getLocalStorage('suppliers');
        const index = items.findIndex((i: any) => i.id === id);
        if (index !== -1) {
          items[index] = { ...items[index], ...updates };
          setLocalStorage('suppliers', items);
          return items[index];
        }
        return null;
      }
      const { data, error } = await supabase!.from('suppliers').update(updates).eq('id', id).select();
      if (error) throw error;
      await logAction(userEmail, 'UPDATE', 'suppliers', id.toString());
      return data[0];
    },
    async softDelete(id: number, userEmail: string) {
      if (!isSupabaseConfigured) {
        const items = getLocalStorage('suppliers');
        const index = items.findIndex((i: any) => i.id === id);
        if (index !== -1) {
          items[index].is_deleted = true;
          setLocalStorage('suppliers', items);
          return true;
        }
        return false;
      }
      const { error } = await supabase!.from('suppliers').update({ is_deleted: true }).eq('id', id);
      if (error) throw error;
      await logAction(userEmail, 'DELETE', 'suppliers', id.toString());
      return true;
    }
  },
  customers: {
    async getAll() {
      return safeCall(
        async () => await supabase!.from('customers').select('*').eq('is_deleted', false).order('name'),
        'customers',
        (c: any) => !c.is_deleted
      );
    },
    async create(customer: any, userEmail: string) {
      if (!isSupabaseConfigured) {
        const items = getLocalStorage('customers');
        const newItem = { ...customer, id: Date.now(), is_deleted: false };
        items.push(newItem);
        setLocalStorage('customers', items);
        return newItem;
      }
      const { data, error } = await supabase!.from('customers').insert([customer]).select();
      if (error) throw error;
      await logAction(userEmail, 'CREATE', 'customers', data[0].id.toString());
      return data[0];
    },
    async update(id: number, updates: any, userEmail: string) {
      if (!isSupabaseConfigured) {
        const items = getLocalStorage('customers');
        const index = items.findIndex((i: any) => i.id === id);
        if (index !== -1) {
          items[index] = { ...items[index], ...updates };
          setLocalStorage('customers', items);
          return items[index];
        }
        return null;
      }
      const { data, error } = await supabase!.from('customers').update(updates).eq('id', id).select();
      if (error) throw error;
      await logAction(userEmail, 'UPDATE', 'customers', id.toString());
      return data[0];
    },
    async softDelete(id: number, userEmail: string) {
      if (!isSupabaseConfigured) {
        const items = getLocalStorage('customers');
        const index = items.findIndex((i: any) => i.id === id);
        if (index !== -1) {
          items[index].is_deleted = true;
          setLocalStorage('customers', items);
          return true;
        }
        return false;
      }
      const { error } = await supabase!.from('customers').update({ is_deleted: true }).eq('id', id);
      if (error) throw error;
      await logAction(userEmail, 'DELETE', 'customers', id.toString());
      return true;
    }
  },
  leads: {
    async getAll() {
      return safeCall(
        async () => await supabase!.from('leads').select('*').eq('is_deleted', false).order('created_at', { ascending: false }),
        'leads',
        (l: any) => !l.is_deleted
      );
    },
    async create(lead: any, userEmail: string) {
      if (!isSupabaseConfigured) {
        const items = getLocalStorage('leads');
        const newItem = { ...lead, id: Date.now(), is_deleted: false, created_at: new Date().toISOString() };
        items.push(newItem);
        setLocalStorage('leads', items);
        return newItem;
      }
      const { data, error } = await supabase!.from('leads').insert([lead]).select();
      if (error) throw error;
      await logAction(userEmail, 'CREATE', 'leads', data[0].id.toString());
      return data[0];
    },
    async update(id: number, updates: any, userEmail: string) {
      if (!isSupabaseConfigured) {
        const items = getLocalStorage('leads');
        const index = items.findIndex((i: any) => i.id === id);
        if (index !== -1) {
          items[index] = { ...items[index], ...updates };
          setLocalStorage('leads', items);
          return items[index];
        }
        return null;
      }
      const { data, error } = await supabase!.from('leads').update(updates).eq('id', id).select();
      if (error) throw error;
      await logAction(userEmail, 'UPDATE', 'leads', id.toString());
      return data[0];
    },
    async softDelete(id: number, userEmail: string) {
      if (!isSupabaseConfigured) {
        const items = getLocalStorage('leads');
        const index = items.findIndex((i: any) => i.id === id);
        if (index !== -1) {
          items[index].is_deleted = true;
          setLocalStorage('leads', items);
          return true;
        }
        return false;
      }
      const { error } = await supabase!.from('leads').update({ is_deleted: true }).eq('id', id);
      if (error) throw error;
      await logAction(userEmail, 'DELETE', 'leads', id.toString());
      return true;
    }
  },
  opportunities: {
    async getAll() {
      return safeCall(
        async () => await supabase!.from('opportunities').select('*, customers(name)').eq('is_deleted', false).order('created_at', { ascending: false }),
        'opportunities',
        (o: any) => !o.is_deleted
      );
    },
    async create(opportunity: any, userEmail: string) {
      if (!isSupabaseConfigured) {
        const items = getLocalStorage('opportunities');
        const newItem = { ...opportunity, id: Date.now(), is_deleted: false, created_at: new Date().toISOString() };
        items.push(newItem);
        setLocalStorage('opportunities', items);
        return newItem;
      }
      const { data, error } = await supabase!.from('opportunities').insert([opportunity]).select();
      if (error) throw error;
      await logAction(userEmail, 'CREATE', 'opportunities', data[0].id.toString());
      return data[0];
    },
    async update(id: number, updates: any, userEmail: string) {
      if (!isSupabaseConfigured) {
        const items = getLocalStorage('opportunities');
        const index = items.findIndex((i: any) => i.id === id);
        if (index !== -1) {
          items[index] = { ...items[index], ...updates };
          setLocalStorage('opportunities', items);
          return items[index];
        }
        return null;
      }
      const { data, error } = await supabase!.from('opportunities').update(updates).eq('id', id).select();
      if (error) throw error;
      await logAction(userEmail, 'UPDATE', 'opportunities', id.toString());
      return data[0];
    },
    async softDelete(id: number, userEmail: string) {
      if (!isSupabaseConfigured) {
        const items = getLocalStorage('opportunities');
        const index = items.findIndex((i: any) => i.id === id);
        if (index !== -1) {
          items[index].is_deleted = true;
          setLocalStorage('opportunities', items);
          return true;
        }
        return false;
      }
      const { error } = await supabase!.from('opportunities').update({ is_deleted: true }).eq('id', id);
      if (error) throw error;
      await logAction(userEmail, 'DELETE', 'opportunities', id.toString());
      return true;
    }
  },
  tasks: {
    async getAll() {
      return safeCall(
        async () => await supabase!.from('tasks').select('*').eq('is_deleted', false).order('due_date', { ascending: true }),
        'tasks',
        (t: any) => !t.is_deleted
      );
    },
    async create(task: any, userEmail: string) {
      if (!isSupabaseConfigured) {
        const items = getLocalStorage('tasks');
        const newItem = { ...task, id: Date.now(), is_deleted: false };
        items.push(newItem);
        setLocalStorage('tasks', items);
        return newItem;
      }
      const { data, error } = await supabase!.from('tasks').insert([task]).select();
      if (error) throw error;
      await logAction(userEmail, 'CREATE', 'tasks', data[0].id.toString());
      return data[0];
    },
    async update(id: number, updates: any, userEmail: string) {
      if (!isSupabaseConfigured) {
        const items = getLocalStorage('tasks');
        const index = items.findIndex((i: any) => i.id === id);
        if (index !== -1) {
          items[index] = { ...items[index], ...updates };
          setLocalStorage('tasks', items);
          return items[index];
        }
        return null;
      }
      const { data, error } = await supabase!.from('tasks').update(updates).eq('id', id).select();
      if (error) throw error;
      await logAction(userEmail, 'UPDATE', 'tasks', id.toString());
      return data[0];
    },
    async softDelete(id: number, userEmail: string) {
      if (!isSupabaseConfigured) {
        const items = getLocalStorage('tasks');
        const index = items.findIndex((i: any) => i.id === id);
        if (index !== -1) {
          items[index].is_deleted = true;
          setLocalStorage('tasks', items);
          return true;
        }
        return false;
      }
      const { error } = await supabase!.from('tasks').update({ is_deleted: true }).eq('id', id);
      if (error) throw error;
      await logAction(userEmail, 'DELETE', 'tasks', id.toString());
      return true;
    }
  },
  purchases: {
    async getAll() {
      const data = await safeCall(
        async () => await supabase!.from('purchases').select('*, suppliers(name)').eq('is_deleted', false).order('date', { ascending: false }),
        'purchases',
        (p: any) => !p.is_deleted
      );
      return data.map((p: any) => ({
        ...p,
        supplier_name: p.suppliers?.name || p.supplier_name
      }));
    },
    async create(purchase: any, items: any[], userEmail: string) {
      if (!isSupabaseConfigured) {
        const purchases = getLocalStorage('purchases');
        const purchaseId = Date.now();
        const newPurchase = { ...purchase, id: purchaseId, is_deleted: false };
        purchases.push(newPurchase);
        setLocalStorage('purchases', purchases);

        const purchaseItems = getLocalStorage('purchase_items');
        items.forEach(item => {
          purchaseItems.push({ ...item, id: Date.now() + Math.random(), purchase_id: purchaseId });
          // Update stock locally
          const products = getLocalStorage('products');
          const pIdx = products.findIndex((p: any) => p.id === parseInt(item.product_id));
          if (pIdx !== -1) {
            products[pIdx].stock = (products[pIdx].stock || 0) + parseInt(item.quantity);
            setLocalStorage('products', products);
          }
        });
        setLocalStorage('purchase_items', purchaseItems);
        return newPurchase;
      }
      
      const { data: purchaseData, error: pError } = await supabase!
        .from('purchases')
        .insert([purchase])
        .select();
      
      if (pError) throw pError;
      const purchaseId = purchaseData[0].id;

      const itemsToInsert = items.map(item => ({
        ...item,
        purchase_id: purchaseId
      }));
      
      const { error: iError } = await supabase!
        .from('purchase_items')
        .insert(itemsToInsert);
      
      if (iError) throw iError;

      for (const item of items) {
        await supabase!.rpc('increment_stock', { 
          product_id: parseInt(item.product_id), 
          amount: parseInt(item.quantity)
        });
      }

      await logAction(userEmail, 'CREATE', 'purchases', purchaseId.toString());
      return purchaseData[0];
    },
    async getById(id: number) {
      if (!isSupabaseConfigured) {
        const purchases = getLocalStorage('purchases');
        const purchase = purchases.find((p: any) => p.id === id);
        if (!purchase) return null;
        const items = getLocalStorage('purchase_items').filter((i: any) => i.purchase_id === id);
        const products = getLocalStorage('products');
        const suppliers = getLocalStorage('suppliers');
        const supplier = suppliers.find((s: any) => s.id === purchase.supplier_id);

        return {
          ...purchase,
          supplier_name: supplier?.name,
          items: items.map((item: any) => {
            const prod = products.find((p: any) => p.id === parseInt(item.product_id));
            return {
              ...item,
              product_name: prod?.name,
              total: item.quantity * item.rate
            };
          })
        };
      }
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
    },
    async softDelete(id: number, userEmail: string) {
      if (!isSupabaseConfigured) {
        const purchases = getLocalStorage('purchases');
        const idx = purchases.findIndex((p: any) => p.id === id);
        if (idx !== -1) {
          purchases[idx].is_deleted = true;
          setLocalStorage('purchases', purchases);
          return true;
        }
        return false;
      }
      
      const { data: items } = await supabase!
        .from('purchase_items')
        .select('*')
        .eq('purchase_id', id);
      
      if (items) {
        for (const item of items) {
          await supabase!.rpc('decrement_stock', {
            product_id: item.product_id,
            amount: item.quantity
          });
        }
      }

      const { error } = await supabase!.from('purchases').update({ is_deleted: true }).eq('id', id);
      if (error) throw error;
      await logAction(userEmail, 'DELETE', 'purchases', id.toString());
      return true;
    }
  },
  sales: {
    async getAll() {
      const data = await safeCall(
        async () => await supabase!.from('sales').select('*, customers(name)').eq('is_deleted', false).order('date', { ascending: false }),
        'sales',
        (s: any) => !s.is_deleted
      );
      return data.map((s: any) => ({
        ...s,
        customer_name: s.customers?.name || s.customer_name
      }));
    },
    async create(sale: any, items: any[], userEmail: string) {
      if (!isSupabaseConfigured) {
        const sales = getLocalStorage('sales');
        const saleId = Date.now();
        const newSale = { ...sale, id: saleId, is_deleted: false };
        sales.push(newSale);
        setLocalStorage('sales', sales);

        const saleItems = getLocalStorage('sales_items');
        items.forEach(item => {
          saleItems.push({ ...item, id: Date.now() + Math.random(), sale_id: saleId });
          // Update stock locally
          const products = getLocalStorage('products');
          const pIdx = products.findIndex((p: any) => p.id === parseInt(item.product_id));
          if (pIdx !== -1) {
            products[pIdx].stock = (products[pIdx].stock || 0) - parseInt(item.quantity);
            setLocalStorage('products', products);
          }
        });
        setLocalStorage('sales_items', saleItems);
        return newSale;
      }
      
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
        await supabase!.rpc('decrement_stock', { 
          product_id: parseInt(item.product_id), 
          amount: parseInt(item.quantity)
        });
      }

      await logAction(userEmail, 'CREATE', 'sales', saleId.toString());
      return saleData[0];
    },
    async getById(id: number) {
      if (!isSupabaseConfigured) {
        const sales = getLocalStorage('sales');
        const sale = sales.find((s: any) => s.id === id);
        if (!sale) return null;
        const items = getLocalStorage('sales_items').filter((i: any) => i.sale_id === id);
        const products = getLocalStorage('products');
        const customers = getLocalStorage('customers');
        const customer = customers.find((c: any) => c.id === sale.customer_id);

        return {
          ...sale,
          customer_name: customer?.name,
          items: items.map((item: any) => {
            const prod = products.find((p: any) => p.id === parseInt(item.product_id));
            return {
              ...item,
              product_name: prod?.name,
              total: item.quantity * item.rate
            };
          })
        };
      }
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
    },
    async softDelete(id: number, userEmail: string) {
      if (!isSupabaseConfigured) {
        const sales = getLocalStorage('sales');
        const idx = sales.findIndex((s: any) => s.id === id);
        if (idx !== -1) {
          sales[idx].is_deleted = true;
          setLocalStorage('sales', sales);
          return true;
        }
        return false;
      }

      const { data: items } = await supabase!
        .from('sales_items')
        .select('*')
        .eq('sale_id', id);
      
      if (items) {
        for (const item of items) {
          await supabase!.rpc('increment_stock', {
            product_id: item.product_id,
            amount: item.quantity
          });
        }
      }

      const { error } = await supabase!.from('sales').update({ is_deleted: true }).eq('id', id);
      if (error) throw error;
      await logAction(userEmail, 'DELETE', 'sales', id.toString());
      return true;
    }
  },
  production: {
    async getAll() {
      const data = await safeCall(
        async () => await supabase!.from('production').select('*, preform:products!preform_product_id(name), bottle:products!bottle_product_id(name)').eq('is_deleted', false).order('date', { ascending: false }),
        'production',
        (p: any) => !p.is_deleted
      );
      return data.map((e: any) => ({
        ...e,
        preform_name: e.preform?.name || e.preform_name,
        bottle_name: e.bottle?.name || e.bottle_name
      }));
    },
    async create(entry: any, userEmail: string) {
      if (!isSupabaseConfigured) {
        const items = getLocalStorage('production');
        const newItem = { ...entry, id: Date.now(), is_deleted: false };
        items.push(newItem);
        setLocalStorage('production', items);

        // Update stock locally
        const products = getLocalStorage('products');
        const preformIdx = products.findIndex((p: any) => p.id === entry.preform_product_id);
        const bottleIdx = products.findIndex((p: any) => p.id === entry.bottle_product_id);
        if (preformIdx !== -1) products[preformIdx].stock = (products[preformIdx].stock || 0) - entry.quantity;
        if (bottleIdx !== -1) products[bottleIdx].stock = (products[bottleIdx].stock || 0) + entry.quantity;
        setLocalStorage('products', products);

        return newItem;
      }
      
      const { data, error } = await supabase!
        .from('production')
        .insert([entry])
        .select();
      
      if (error) throw error;

      await supabase!.rpc('decrement_stock', { 
        product_id: entry.preform_product_id, 
        amount: entry.quantity 
      });
      await supabase!.rpc('increment_stock', { 
        product_id: entry.bottle_product_id, 
        amount: entry.quantity 
      });

      await logAction(userEmail, 'CREATE', 'production', data[0].id.toString());
      return data[0];
    },
    async softDelete(id: number, userEmail: string) {
      if (!isSupabaseConfigured) {
        const items = getLocalStorage('production');
        const idx = items.findIndex((i: any) => i.id === id);
        if (idx !== -1) {
          items[idx].is_deleted = true;
          setLocalStorage('production', items);
          return true;
        }
        return false;
      }

      const { data: entry } = await supabase!
        .from('production')
        .select('*')
        .eq('id', id)
        .single();
      
      if (entry) {
        await supabase!.rpc('increment_stock', {
          product_id: entry.preform_product_id,
          amount: entry.quantity
        });
        await supabase!.rpc('decrement_stock', {
          product_id: entry.bottle_product_id,
          amount: entry.quantity
        });
      }

      const { error } = await supabase!.from('production').update({ is_deleted: true }).eq('id', id);
      if (error) throw error;
      await logAction(userEmail, 'DELETE', 'production', id.toString());
      return true;
    }
  },
  auditLogs: {
    async getAll() {
      return safeCall(
        async () => await supabase!.from('audit_logs').select('*').order('timestamp', { ascending: false }),
        'audit_logs'
      );
    }
  },
  stockAdjustments: {
    async getAll() {
      return safeCall(
        async () => await supabase!.from('stock_adjustments').select('*, products(name)').order('created_at', { ascending: false }),
        'stock_adjustments'
      );
    },
    async create(adjustment: any, userEmail: string) {
      const { product_id, type, quantity, reason } = adjustment;
      const amount = type === 'Add' ? parseInt(quantity) : -parseInt(quantity);

      if (!isSupabaseConfigured) {
        const adjustments = getLocalStorage('stock_adjustments');
        const newAdjustment = { ...adjustment, id: Date.now(), created_at: new Date().toISOString(), user_email: userEmail };
        adjustments.push(newAdjustment);
        setLocalStorage('stock_adjustments', adjustments);

        const products = getLocalStorage('products');
        const pIdx = products.findIndex((p: any) => p.id === parseInt(product_id));
        if (pIdx !== -1) {
          products[pIdx].stock = (products[pIdx].stock || 0) + amount;
          setLocalStorage('products', products);
        }
        return newAdjustment;
      }

      const { data, error } = await supabase!.from('stock_adjustments').insert([{
        product_id,
        type,
        quantity: parseInt(quantity),
        reason,
        user_email: userEmail
      }]).select();
      
      if (error) throw error;

      const { data: product } = await supabase!.from('products').select('stock').eq('id', product_id).single();
      if (product) {
        await supabase!.from('products').update({ stock: (product.stock || 0) + amount }).eq('id', product_id);
      }

      await logAction(userEmail, 'CREATE', 'stock_adjustments', data[0].id.toString());
      return data[0];
    }
  },
  dashboard: {
    async getStats() {
      const getLocalStats = () => {
        const sales = getLocalStorage('sales').filter((s: any) => !s.is_deleted);
        const purchases = getLocalStorage('purchases').filter((p: any) => !p.is_deleted);
        const production = getLocalStorage('production').filter((p: any) => !p.is_deleted);
        const customers = getLocalStorage('customers').filter((c: any) => !c.is_deleted);
        const leads = getLocalStorage('leads').filter((l: any) => !l.is_deleted);
        const opportunities = getLocalStorage('opportunities').filter((o: any) => !o.is_deleted);

        const totalSales = sales.reduce((sum: number, s: any) => sum + (s.total_amount || 0), 0);
        const totalPurchases = purchases.reduce((sum: number, p: any) => sum + (p.total_amount || 0), 0);
        const totalProduction = production.reduce((sum: number, p: any) => sum + (p.quantity || 0), 0);
        const pipelineValue = opportunities.reduce((sum: number, o: any) => sum + (parseFloat(o.value) || 0), 0);
        
        return {
          totalSales: `₹${totalSales.toLocaleString()}`,
          totalPurchases: `₹${totalPurchases.toLocaleString()}`,
          totalProduction: totalProduction.toLocaleString(),
          activeCustomers: customers.length.toString(),
          totalLeads: leads.length.toString(),
          pipelineValue: `₹${pipelineValue.toLocaleString()}`,
          salesTrend: 'up',
          salesTrendVal: '+0%',
          purchaseTrend: 'up',
          purchaseTrendVal: '+0%',
          productionTrend: 'up',
          productionTrendVal: '+0%',
          customerTrend: 'up',
          customerTrendVal: '+0%',
          leadsTrend: 'up',
          leadsTrendVal: '+0%',
        };
      };

      if (!isSupabaseConfigured) return getLocalStats();

      try {
        const [
          { data: sales, error: sErr },
          { data: purchases, error: pErr },
          { data: production, error: prErr },
          { data: customers, error: cErr },
          { count: leadsCount, error: lErr },
          { data: opportunities, error: oErr }
        ] = await Promise.all([
          supabase!.from('sales').select('total_amount').eq('is_deleted', false),
          supabase!.from('purchases').select('total_amount').eq('is_deleted', false),
          supabase!.from('production').select('quantity').eq('is_deleted', false),
          supabase!.from('customers').select('id', { count: 'exact' }).eq('is_deleted', false),
          supabase!.from('leads').select('id', { count: 'exact' }).eq('is_deleted', false),
          supabase!.from('opportunities').select('value').eq('is_deleted', false)
        ]);

        if (sErr || pErr || prErr || cErr || lErr || oErr) {
          console.warn('Supabase stats query failed, falling back to local storage');
          return getLocalStats();
        }

        const totalSales = (sales || []).reduce((sum, s) => sum + (s.total_amount || 0), 0);
        const totalPurchases = (purchases || []).reduce((sum, p) => sum + (p.total_amount || 0), 0);
        const totalProduction = (production || []).reduce((sum, p) => sum + (p.quantity || 0), 0);
        const activeCustomers = customers?.length || 0;
        const pipelineValue = (opportunities || []).reduce((sum, o) => sum + (o.value || 0), 0);

        return {
          totalSales: `₹${totalSales.toLocaleString()}`,
          totalPurchases: `₹${totalPurchases.toLocaleString()}`,
          totalProduction: totalProduction.toLocaleString(),
          activeCustomers: activeCustomers.toString(),
          totalLeads: (leadsCount || 0).toString(),
          pipelineValue: `₹${pipelineValue.toLocaleString()}`,
          salesTrend: 'up',
          salesTrendVal: '+0%',
          purchaseTrend: 'up',
          purchaseTrendVal: '+0%',
          productionTrend: 'up',
          productionTrendVal: '+0%',
          customerTrend: 'up',
          customerTrendVal: '+0%',
          leadsTrend: 'up',
          leadsTrendVal: '+0%',
        };
      } catch (e) {
        console.error('Dashboard stats failed, falling back to local storage', e);
        return getLocalStats();
      }
    },
    async getCharts() {
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
  },
  reports: {
    async getStockReport() {
      if (!isSupabaseConfigured) {
        const products = getLocalStorage('products').filter((p: any) => !p.is_deleted);
        return products.map((p: any) => ({
          ...p,
          is_low_stock: (p.stock || 0) <= (p.min_stock_level || 0)
        }));
      }
      const { data, error } = await supabase!
        .from('products')
        .select('*')
        .eq('is_deleted', false)
        .order('stock', { ascending: true });
      if (error) throw error;
      return data.map(p => ({
        ...p,
        is_low_stock: p.stock <= p.min_stock_level
      }));
    },
    async getProfitLossReport(startDate: string, endDate: string) {
      if (!isSupabaseConfigured) {
        const sales = getLocalStorage('sales').filter((s: any) => !s.is_deleted && s.date >= startDate && s.date <= endDate);
        const saleItems = getLocalStorage('sales_items');
        const products = getLocalStorage('products');

        const items = sales.flatMap((s: any) => {
          const sItems = saleItems.filter((si: any) => si.sale_id === s.id);
          return sItems.map((item: any) => {
            const prod = products.find((p: any) => p.id === parseInt(item.product_id));
            return {
              date: s.date,
              product_name: prod?.name,
              rate: item.rate,
              quantity: item.quantity,
              last_purchase_rate: 0,
              gross_profit: item.quantity * (item.rate - 0),
              net_profit: item.quantity * (item.rate - 0)
            };
          });
        });

        const totalGross = items.reduce((sum: number, i: any) => sum + i.gross_profit, 0);

        return {
          summary: {
            totalGrossProfit: totalGross,
            totalTransportCost: 0,
            totalNetProfit: totalGross
          },
          items
        };
      }
      const { data: sales, error } = await supabase!
        .from('sales')
        .select('*, sales_items(*, products(name))')
        .eq('is_deleted', false)
        .gte('date', startDate)
        .lte('date', endDate);
      
      if (error) throw error;

      const items = (sales || []).flatMap(s => s.sales_items.map((item: any) => ({
        date: s.date,
        product_name: item.products?.name,
        rate: item.rate,
        quantity: item.quantity,
        last_purchase_rate: 0,
        gross_profit: item.quantity * (item.rate - 0),
        net_profit: item.quantity * (item.rate - 0)
      })));

      const totalGross = items.reduce((sum, i) => sum + i.gross_profit, 0);

      return {
        summary: {
          totalGrossProfit: totalGross,
          totalTransportCost: 0,
          totalNetProfit: totalGross
        },
        items
      };
    }
  }
};

