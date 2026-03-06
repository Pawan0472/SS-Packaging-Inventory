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

export const seedDemoData = async () => {
  const products = getLocalStorage('products');
  if (products.length === 0) {
    const demoProducts = [
      { name: '500ml PET Bottle', category: 'Bottle', gram_weight: '18g', stock: 12500, min_stock_level: 5000, price: 4.50, is_deleted: false },
      { name: '1L PET Preform', category: 'Preform', gram_weight: '24g', stock: 4200, min_stock_level: 10000, price: 8.20, is_deleted: false },
      { name: '2L PET Bottle', category: 'Bottle', gram_weight: '32g', stock: 8900, min_stock_level: 5000, price: 12.00, is_deleted: false },
    ];
    setLocalStorage('products', demoProducts);
  }

  const suppliers = getLocalStorage('suppliers');
  if (suppliers.length === 0) {
    const demoSuppliers = [
      { name: 'Global Polymers Ltd', contact_person: 'John Doe', email: 'john@global.com', phone: '9876543210', is_deleted: false },
      { name: 'Apex Masterbatch', contact_person: 'Jane Smith', email: 'jane@apex.com', phone: '9876543211', is_deleted: false },
    ];
    setLocalStorage('suppliers', demoSuppliers);
  }

  const customers = getLocalStorage('customers');
  if (customers.length === 0) {
    const demoCustomers = [
      { name: 'Reliance Industries', contact_person: 'Mukesh A.', email: 'mukesh@reliance.com', phone: '9876543212', is_deleted: false },
      { name: 'Tata Consumer Products', contact_person: 'Ratan T.', email: 'ratan@tata.com', phone: '9876543213', is_deleted: false },
    ];
    setLocalStorage('customers', demoCustomers);
  }
};

const safeCall = async (supabaseCall: () => Promise<any>, localStorageKey: string, filterFn?: (item: any) => boolean) => {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabaseCall();
      if (!error && data) {
        // Apply filter even to Supabase data if provided
        const filteredData = filterFn ? data.filter(filterFn) : data;
        // Update local cache with Supabase data
        setLocalStorage(localStorageKey, filteredData);
        return filteredData;
      }
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
        async () => await supabase!.from('products').select('*').order('name'),
        'products',
        (p: any) => !p.is_deleted
      );
    },
    async create(product: any, userEmail: string) {
      let result;
      if (isSupabaseConfigured) {
        const { data, error } = await supabase!.from('products').insert([product]).select();
        if (error) throw error;
        result = data[0];
        await logAction(userEmail, 'CREATE', 'products', result.id.toString());
      } else {
        result = { ...product, id: Date.now(), is_deleted: false, stock: product.stock || 0 };
      }

      // Always update local storage
      const products = getLocalStorage('products');
      products.push(result);
      setLocalStorage('products', products);
      return result;
    },
    async update(id: number, updates: any, userEmail: string) {
      let result;
      if (isSupabaseConfigured) {
        const { data, error } = await supabase!.from('products').update(updates).eq('id', id).select();
        if (error) throw error;
        result = data[0];
        await logAction(userEmail, 'UPDATE', 'products', id.toString());
      } else {
        const products = getLocalStorage('products');
        const index = products.findIndex((p: any) => p.id === id);
        if (index !== -1) {
          products[index] = { ...products[index], ...updates };
          result = products[index];
        }
      }

      if (result) {
        const products = getLocalStorage('products');
        const index = products.findIndex((p: any) => p.id === id);
        if (index !== -1) {
          products[index] = result;
          setLocalStorage('products', products);
        }
      }
      return result;
    },
    async softDelete(id: number, userEmail: string) {
      if (isSupabaseConfigured) {
        const { error } = await supabase!.from('products').update({ is_deleted: true }).eq('id', id);
        if (error) throw error;
        await logAction(userEmail, 'DELETE', 'products', id.toString());
      }
      
      const products = getLocalStorage('products');
      const index = products.findIndex((p: any) => p.id === id);
      if (index !== -1) {
        products[index].is_deleted = true;
        setLocalStorage('products', products);
        return true;
      }
      return false;
    }
  },
  suppliers: {
    async getAll() {
      return safeCall(
        async () => await supabase!.from('suppliers').select('*').order('name'),
        'suppliers',
        (s: any) => !s.is_deleted
      );
    },
    async create(supplier: any, userEmail: string) {
      let result;
      if (isSupabaseConfigured) {
        const { data, error } = await supabase!.from('suppliers').insert([supplier]).select();
        if (error) throw error;
        result = data[0];
        await logAction(userEmail, 'CREATE', 'suppliers', result.id.toString());
      } else {
        result = { ...supplier, id: Date.now(), is_deleted: false };
      }
      const items = getLocalStorage('suppliers');
      items.push(result);
      setLocalStorage('suppliers', items);
      return result;
    },
    async update(id: number, updates: any, userEmail: string) {
      let result;
      if (isSupabaseConfigured) {
        const { data, error } = await supabase!.from('suppliers').update(updates).eq('id', id).select();
        if (error) throw error;
        result = data[0];
        await logAction(userEmail, 'UPDATE', 'suppliers', id.toString());
      } else {
        const items = getLocalStorage('suppliers');
        const index = items.findIndex((i: any) => i.id === id);
        if (index !== -1) {
          items[index] = { ...items[index], ...updates };
          result = items[index];
        }
      }
      if (result) {
        const items = getLocalStorage('suppliers');
        const index = items.findIndex((i: any) => i.id === id);
        if (index !== -1) {
          items[index] = result;
          setLocalStorage('suppliers', items);
        }
      }
      return result;
    },
    async softDelete(id: number, userEmail: string) {
      if (isSupabaseConfigured) {
        const { error } = await supabase!.from('suppliers').update({ is_deleted: true }).eq('id', id);
        if (error) throw error;
        await logAction(userEmail, 'DELETE', 'suppliers', id.toString());
      }
      const items = getLocalStorage('suppliers');
      const index = items.findIndex((i: any) => i.id === id);
      if (index !== -1) {
        items[index].is_deleted = true;
        setLocalStorage('suppliers', items);
        return true;
      }
      return false;
    }
  },
  customers: {
    async getAll() {
      return safeCall(
        async () => await supabase!.from('customers').select('*').order('name'),
        'customers',
        (c: any) => !c.is_deleted
      );
    },
    async create(customer: any, userEmail: string) {
      let result;
      if (isSupabaseConfigured) {
        const { data, error } = await supabase!.from('customers').insert([customer]).select();
        if (error) throw error;
        result = data[0];
        await logAction(userEmail, 'CREATE', 'customers', result.id.toString());
      } else {
        result = { ...customer, id: Date.now(), is_deleted: false };
      }
      const items = getLocalStorage('customers');
      items.push(result);
      setLocalStorage('customers', items);
      return result;
    },
    async update(id: number, updates: any, userEmail: string) {
      let result;
      if (isSupabaseConfigured) {
        const { data, error } = await supabase!.from('customers').update(updates).eq('id', id).select();
        if (error) throw error;
        result = data[0];
        await logAction(userEmail, 'UPDATE', 'customers', id.toString());
      } else {
        const items = getLocalStorage('customers');
        const index = items.findIndex((i: any) => i.id === id);
        if (index !== -1) {
          items[index] = { ...items[index], ...updates };
          result = items[index];
        }
      }
      if (result) {
        const items = getLocalStorage('customers');
        const index = items.findIndex((i: any) => i.id === id);
        if (index !== -1) {
          items[index] = result;
          setLocalStorage('customers', items);
        }
      }
      return result;
    },
    async softDelete(id: number, userEmail: string) {
      if (isSupabaseConfigured) {
        const { error } = await supabase!.from('customers').update({ is_deleted: true }).eq('id', id);
        if (error) throw error;
        await logAction(userEmail, 'DELETE', 'customers', id.toString());
      }
      const items = getLocalStorage('customers');
      const index = items.findIndex((i: any) => i.id === id);
      if (index !== -1) {
        items[index].is_deleted = true;
        setLocalStorage('customers', items);
        return true;
      }
      return false;
    }
  },
  leads: {
    async getAll() {
      return safeCall(
        async () => await supabase!.from('leads').select('*').order('created_at', { ascending: false }),
        'leads',
        (l: any) => !l.is_deleted
      );
    },
    async create(lead: any, userEmail: string) {
      let result;
      if (isSupabaseConfigured) {
        const { data, error } = await supabase!.from('leads').insert([lead]).select();
        if (error) throw error;
        result = data[0];
        await logAction(userEmail, 'CREATE', 'leads', result.id.toString());
      } else {
        result = { ...lead, id: Date.now(), is_deleted: false, created_at: new Date().toISOString() };
      }
      const items = getLocalStorage('leads');
      items.push(result);
      setLocalStorage('leads', items);
      return result;
    },
    async update(id: number, updates: any, userEmail: string) {
      let result;
      if (isSupabaseConfigured) {
        const { data, error } = await supabase!.from('leads').update(updates).eq('id', id).select();
        if (error) throw error;
        result = data[0];
        await logAction(userEmail, 'UPDATE', 'leads', id.toString());
      } else {
        const items = getLocalStorage('leads');
        const index = items.findIndex((i: any) => i.id === id);
        if (index !== -1) {
          items[index] = { ...items[index], ...updates };
          result = items[index];
        }
      }
      if (result) {
        const items = getLocalStorage('leads');
        const index = items.findIndex((i: any) => i.id === id);
        if (index !== -1) {
          items[index] = result;
          setLocalStorage('leads', items);
        }
      }
      return result;
    },
    async softDelete(id: number, userEmail: string) {
      if (isSupabaseConfigured) {
        const { error } = await supabase!.from('leads').update({ is_deleted: true }).eq('id', id);
        if (error) throw error;
        await logAction(userEmail, 'DELETE', 'leads', id.toString());
      }
      const items = getLocalStorage('leads');
      const index = items.findIndex((i: any) => i.id === id);
      if (index !== -1) {
        items[index].is_deleted = true;
        setLocalStorage('leads', items);
        return true;
      }
      return false;
    }
  },
  opportunities: {
    async getAll() {
      return safeCall(
        async () => await supabase!.from('opportunities').select('*, customers(name)').order('created_at', { ascending: false }),
        'opportunities',
        (o: any) => !o.is_deleted
      );
    },
    async create(opportunity: any, userEmail: string) {
      let result;
      if (isSupabaseConfigured) {
        const { data, error } = await supabase!.from('opportunities').insert([opportunity]).select();
        if (error) throw error;
        result = data[0];
        await logAction(userEmail, 'CREATE', 'opportunities', result.id.toString());
      } else {
        result = { ...opportunity, id: Date.now(), is_deleted: false, created_at: new Date().toISOString() };
      }
      const items = getLocalStorage('opportunities');
      items.push(result);
      setLocalStorage('opportunities', items);
      return result;
    },
    async update(id: number, updates: any, userEmail: string) {
      let result;
      if (isSupabaseConfigured) {
        const { data, error } = await supabase!.from('opportunities').update(updates).eq('id', id).select();
        if (error) throw error;
        result = data[0];
        await logAction(userEmail, 'UPDATE', 'opportunities', id.toString());
      } else {
        const items = getLocalStorage('opportunities');
        const index = items.findIndex((i: any) => i.id === id);
        if (index !== -1) {
          items[index] = { ...items[index], ...updates };
          result = items[index];
        }
      }
      if (result) {
        const items = getLocalStorage('opportunities');
        const index = items.findIndex((i: any) => i.id === id);
        if (index !== -1) {
          items[index] = result;
          setLocalStorage('opportunities', items);
        }
      }
      return result;
    },
    async softDelete(id: number, userEmail: string) {
      if (isSupabaseConfigured) {
        const { error } = await supabase!.from('opportunities').update({ is_deleted: true }).eq('id', id);
        if (error) throw error;
        await logAction(userEmail, 'DELETE', 'opportunities', id.toString());
      }
      const items = getLocalStorage('opportunities');
      const index = items.findIndex((i: any) => i.id === id);
      if (index !== -1) {
        items[index].is_deleted = true;
        setLocalStorage('opportunities', items);
        return true;
      }
      return false;
    }
  },
  tasks: {
    async getAll() {
      return safeCall(
        async () => await supabase!.from('tasks').select('*').order('due_date', { ascending: true }),
        'tasks',
        (t: any) => !t.is_deleted
      );
    },
    async create(task: any, userEmail: string) {
      let result;
      if (isSupabaseConfigured) {
        const { data, error } = await supabase!.from('tasks').insert([task]).select();
        if (error) throw error;
        result = data[0];
        await logAction(userEmail, 'CREATE', 'tasks', result.id.toString());
      } else {
        result = { ...task, id: Date.now(), is_deleted: false };
      }
      const items = getLocalStorage('tasks');
      items.push(result);
      setLocalStorage('tasks', items);
      return result;
    },
    async update(id: number, updates: any, userEmail: string) {
      let result;
      if (isSupabaseConfigured) {
        const { data, error } = await supabase!.from('tasks').update(updates).eq('id', id).select();
        if (error) throw error;
        result = data[0];
        await logAction(userEmail, 'UPDATE', 'tasks', id.toString());
      } else {
        const items = getLocalStorage('tasks');
        const index = items.findIndex((i: any) => i.id === id);
        if (index !== -1) {
          items[index] = { ...items[index], ...updates };
          result = items[index];
        }
      }
      if (result) {
        const items = getLocalStorage('tasks');
        const index = items.findIndex((i: any) => i.id === id);
        if (index !== -1) {
          items[index] = result;
          setLocalStorage('tasks', items);
        }
      }
      return result;
    },
    async softDelete(id: number, userEmail: string) {
      if (isSupabaseConfigured) {
        const { error } = await supabase!.from('tasks').update({ is_deleted: true }).eq('id', id);
        if (error) throw error;
        await logAction(userEmail, 'DELETE', 'tasks', id.toString());
      }
      const items = getLocalStorage('tasks');
      const index = items.findIndex((i: any) => i.id === id);
      if (index !== -1) {
        items[index].is_deleted = true;
        setLocalStorage('tasks', items);
        return true;
      }
      return false;
    }
  },
  purchases: {
    async getAll() {
      const data = await safeCall(
        async () => await supabase!.from('purchases').select('*, suppliers(name)').order('date', { ascending: false }),
        'purchases',
        (p: any) => !p.is_deleted
      );
      return (data || []).map((p: any) => ({
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
        try {
          await supabase!.rpc('increment_stock', { 
            product_id: parseInt(item.product_id), 
            amount: parseInt(item.quantity)
          });
        } catch (e) {
          console.warn('RPC increment_stock failed, trying manual update', e);
          const { data: p } = await supabase!.from('products').select('stock').eq('id', item.product_id).single();
          if (p) {
            await supabase!.from('products').update({ stock: (p.stock || 0) + parseInt(item.quantity) }).eq('id', item.product_id);
          }
        }
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
        async () => await supabase!.from('sales').select('*, customers(name)').order('date', { ascending: false }),
        'sales',
        (s: any) => !s.is_deleted
      );
      return (data || []).map((s: any) => ({
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
        try {
          await supabase!.rpc('decrement_stock', { 
            product_id: parseInt(item.product_id), 
            amount: parseInt(item.quantity)
          });
        } catch (e) {
          console.warn('RPC decrement_stock failed, trying manual update', e);
          const { data: p } = await supabase!.from('products').select('stock').eq('id', item.product_id).single();
          if (p) {
            await supabase!.from('products').update({ stock: Math.max(0, (p.stock || 0) - parseInt(item.quantity)) }).eq('id', item.product_id);
          }
        }
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
        async () => await supabase!.from('production').select('*, preform:products!preform_product_id(name), bottle:products!bottle_product_id(name)').order('date', { ascending: false }),
        'production',
        (p: any) => !p.is_deleted
      );
      return (data || []).map((e: any) => ({
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

      try {
        await supabase!.rpc('decrement_stock', { 
          product_id: entry.preform_product_id, 
          amount: entry.quantity 
        });
      } catch (e) {
        console.warn('RPC decrement_stock failed, trying manual update', e);
        const { data: p } = await supabase!.from('products').select('stock').eq('id', entry.preform_product_id).single();
        if (p) {
          await supabase!.from('products').update({ stock: Math.max(0, (p.stock || 0) - entry.quantity) }).eq('id', entry.preform_product_id);
        }
      }

      try {
        await supabase!.rpc('increment_stock', { 
          product_id: entry.bottle_product_id, 
          amount: entry.quantity 
        });
      } catch (e) {
        console.warn('RPC increment_stock failed, trying manual update', e);
        const { data: p } = await supabase!.from('products').select('stock').eq('id', entry.bottle_product_id).single();
        if (p) {
          await supabase!.from('products').update({ stock: (p.stock || 0) + entry.quantity }).eq('id', entry.bottle_product_id);
        }
      }

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

      let result;
      if (isSupabaseConfigured) {
        const { data, error } = await supabase!.from('stock_adjustments').insert([{
          product_id,
          type,
          quantity: parseInt(quantity),
          reason,
          user_email: userEmail
        }]).select();
        
        if (error) throw error;
        result = data[0];

        // Update product stock using RPC for atomicity with manual fallback
        try {
          if (amount > 0) {
            await supabase!.rpc('increment_stock', { product_id, amount });
          } else {
            await supabase!.rpc('decrement_stock', { product_id, amount: Math.abs(amount) });
          }
        } catch (e) {
          console.warn('RPC stock update failed, trying manual update', e);
          const { data: p } = await supabase!.from('products').select('stock').eq('id', product_id).single();
          if (p) {
            await supabase!.from('products').update({ stock: (p.stock || 0) + amount }).eq('id', product_id);
          }
        }
        
        await logAction(userEmail, 'CREATE', 'stock_adjustments', result.id.toString());
      } else {
        result = { ...adjustment, id: Date.now(), created_at: new Date().toISOString(), user_email: userEmail };
      }

      // Update local storage
      const adjustments = getLocalStorage('stock_adjustments');
      adjustments.push(result);
      setLocalStorage('stock_adjustments', adjustments);

      const products = getLocalStorage('products');
      const pIdx = products.findIndex((p: any) => p.id === parseInt(product_id));
      if (pIdx !== -1) {
        products[pIdx].stock = (products[pIdx].stock || 0) + amount;
        setLocalStorage('products', products);
      }
      
      return result;
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
      const getLocalCharts = () => {
        const sales = getLocalStorage('sales').filter((s: any) => !s.is_deleted);
        const purchases = getLocalStorage('purchases').filter((p: any) => !p.is_deleted);
        const products = getLocalStorage('products').filter((p: any) => !p.is_deleted);
        const salesItems = getLocalStorage('sales_items');

        // Last 6 months labels
        const months = [];
        for (let i = 5; i >= 0; i--) {
          const d = new Date();
          d.setMonth(d.getMonth() - i);
          months.push(d.toLocaleString('default', { month: 'short' }));
        }

        const salesData = months.map(m => ({
          name: m,
          sales: sales.filter((s: any) => new Date(s.date).toLocaleString('default', { month: 'short' }) === m)
                      .reduce((sum: number, s: any) => sum + (s.total_amount || 0), 0),
          purchases: purchases.filter((p: any) => new Date(p.date).toLocaleString('default', { month: 'short' }) === m)
                            .reduce((sum: number, p: any) => sum + (p.total_amount || 0), 0)
        }));

        // Top products by sales quantity
        const productSales: Record<number, number> = {};
        salesItems.forEach((si: any) => {
          productSales[si.product_id] = (productSales[si.product_id] || 0) + (si.quantity || 0);
        });

        const topProducts = Object.entries(productSales)
          .map(([id, qty]) => {
            const p = products.find((prod: any) => prod.id === parseInt(id));
            return { name: p?.name || 'Unknown', value: qty };
          })
          .sort((a, b) => b.value - a.value)
          .slice(0, 4)
          .map((p, i) => ({ ...p, color: ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e'][i] }));

        return { salesData, topProducts };
      };

      if (!isSupabaseConfigured) return getLocalCharts();

      try {
        const [
          { data: sales, error: sErr },
          { data: purchases, error: pErr },
          { data: products, error: prErr },
          { data: salesItems, error: siErr }
        ] = await Promise.all([
          supabase!.from('sales').select('total_amount, date').eq('is_deleted', false),
          supabase!.from('purchases').select('total_amount, date').eq('is_deleted', false),
          supabase!.from('products').select('id, name').eq('is_deleted', false),
          supabase!.from('sales_items').select('product_id, quantity')
        ]);

        if (sErr || pErr || prErr || siErr) return getLocalCharts();

        const months = [];
        for (let i = 5; i >= 0; i--) {
          const d = new Date();
          d.setMonth(d.getMonth() - i);
          months.push(d.toLocaleString('default', { month: 'short' }));
        }

        const salesData = months.map(m => ({
          name: m,
          sales: (sales || []).filter(s => new Date(s.date).toLocaleString('default', { month: 'short' }) === m)
                               .reduce((sum, s) => sum + (s.total_amount || 0), 0),
          purchases: (purchases || []).filter(p => new Date(p.date).toLocaleString('default', { month: 'short' }) === m)
                                     .reduce((sum, p) => sum + (p.total_amount || 0), 0)
        }));

        const productSales: Record<number, number> = {};
        (salesItems || []).forEach(si => {
          productSales[si.product_id] = (productSales[si.product_id] || 0) + (si.quantity || 0);
        });

        const topProducts = Object.entries(productSales)
          .map(([id, qty]) => {
            const p = (products || []).find(prod => prod.id === parseInt(id));
            return { name: p?.name || 'Unknown', value: qty };
          })
          .sort((a, b) => b.value - a.value)
          .slice(0, 4)
          .map((p, i) => ({ ...p, color: ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e'][i] }));

        return { salesData, topProducts };
      } catch (e) {
        return getLocalCharts();
      }
    }
  },
  reports: {
    async getStockReport() {
      const data = await safeCall(
        async () => await supabase!.from('products').select('*').order('stock', { ascending: true }),
        'products',
        (p: any) => !p.is_deleted
      );
      
      return (data || []).map((p: any) => ({
        ...p,
        current_stock: p.stock || 0,
        is_low_stock: (p.stock || 0) <= (p.min_stock_level || 0)
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

