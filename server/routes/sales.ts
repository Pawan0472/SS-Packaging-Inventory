import express from 'express';
import { db } from '../db/index.js';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.js';
import { upload } from '../utils/upload.js';

const router = express.Router();

// Get all sales
router.get('/', authenticate, (req, res) => {
  try {
    const sales = db.prepare(`
      SELECT s.*, c.name as customer_name 
      FROM sales s 
      JOIN customers c ON s.customer_id = c.id 
      WHERE s.is_deleted = 0 
      ORDER BY s.date DESC
    `).all();
    res.json(sales);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get sales details
router.get('/:id', authenticate, (req, res) => {
  const { id } = req.params;
  try {
    const sale = db.prepare(`
      SELECT s.*, c.name as customer_name 
      FROM sales s 
      JOIN customers c ON s.customer_id = c.id 
      WHERE s.id = ?
    `).get(id);
    
    const items = db.prepare(`
      SELECT si.*, pr.name as product_name 
      FROM sales_items si 
      JOIN products pr ON si.product_id = pr.id 
      WHERE si.sales_id = ?
    `).all(id);

    res.json({ ...sale, items });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create sale
router.post('/', authenticate, upload.single('image'), (req: AuthRequest, res) => {
  const { invoice_number, date, customer_id, transport_cost, items } = req.body;
  const parsedItems = JSON.parse(items);
  const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
  const createdBy = req.user?.id;

  const transaction = db.transaction(() => {
    // 1. Validate Stock for each item
    for (const item of parsedItems) {
      const product = db.prepare('SELECT name, category, gram_weight FROM products WHERE id = ?').get(item.product_id) as any;
      
      const purchases = db.prepare('SELECT SUM(quantity) as total FROM purchase_items WHERE product_id = ?').get(item.product_id) as any;
      const sales = db.prepare('SELECT SUM(quantity) as total FROM sales_items WHERE product_id = ?').get(item.product_id) as any;
      
      const purchaseQty = purchases.total || 0;
      const salesQty = sales.total || 0;
      let stock = 0;

      if (product.category === 'Preform') {
        const purchasePcs = product.gram_weight > 0 ? (purchaseQty * 1000) / product.gram_weight : 0;
        const usedInProduction = db.prepare('SELECT SUM(quantity) as total FROM production WHERE preform_product_id = ?').get(item.product_id) as any;
        stock = purchasePcs - salesQty - (usedInProduction.total || 0);
      } else if (product.category === 'Bottle') {
        const producedInProduction = db.prepare('SELECT SUM(quantity) as total FROM production WHERE bottle_product_id = ?').get(item.product_id) as any;
        stock = purchaseQty + (producedInProduction.total || 0) - salesQty;
      } else {
        stock = purchaseQty - salesQty;
      }

      if (Math.floor(stock) < item.quantity) {
        throw new Error(`Insufficient stock for ${product.name}. Available: ${Math.floor(stock)} PCS`);
      }
    }

    // 2. Calculate total amount
    const totalAmount = parsedItems.reduce((sum: number, item: any) => sum + (item.quantity * item.rate), 0) + parseFloat(transport_cost || 0);

    // 3. Insert sales master
    const stmt = db.prepare(`
      INSERT INTO sales (invoice_number, date, customer_id, transport_cost, image_url, total_amount, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(invoice_number, date, customer_id, transport_cost, imageUrl, totalAmount, createdBy);
    const salesId = result.lastInsertRowid;

    // 4. Insert sales items
    const itemStmt = db.prepare(`
      INSERT INTO sales_items (sales_id, product_id, quantity, rate, total)
      VALUES (?, ?, ?, ?, ?)
    `);

    for (const item of parsedItems) {
      itemStmt.run(salesId, item.product_id, item.quantity, item.rate, item.quantity * item.rate);
    }

    return salesId;
  });

  try {
    const salesId = transaction();
    res.status(201).json({ id: salesId, message: 'Sale recorded successfully' });
  } catch (error: any) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(400).json({ message: 'Invoice number already exists' });
    }
    res.status(400).json({ message: error.message || 'Server error' });
  }
});

// Soft delete sale
router.delete('/:id', authenticate, authorize(['admin']), (req, res) => {
  const { id } = req.params;
  try {
    db.prepare('UPDATE sales SET is_deleted = 1 WHERE id = ?').run(id);
    res.json({ message: 'Sale deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export { router as salesRoutes };
