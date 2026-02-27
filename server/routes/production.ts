import express from 'express';
import { db } from '../db/index.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

// Get all production entries
router.get('/', authenticate, (req, res) => {
  try {
    const entries = db.prepare(`
      SELECT p.*, pr1.name as preform_name, pr2.name as bottle_name 
      FROM production p 
      JOIN products pr1 ON p.preform_product_id = pr1.id 
      JOIN products pr2 ON p.bottle_product_id = pr2.id 
      ORDER BY p.date DESC
    `).all();
    res.json(entries);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create production entry
router.post('/', authenticate, (req: AuthRequest, res) => {
  const { date, preform_product_id, bottle_product_id, quantity } = req.body;
  const createdBy = req.user?.id;

    const transaction = db.transaction(() => {
      // 1. Validate Preform Stock
      const preform = db.prepare('SELECT name, gram_weight FROM products WHERE id = ?').get(preform_product_id) as any;
      const purchases = db.prepare('SELECT SUM(quantity) as total FROM purchase_items WHERE product_id = ?').get(preform_product_id) as any;
      const sales = db.prepare('SELECT SUM(quantity) as total FROM sales_items WHERE product_id = ?').get(preform_product_id) as any;
      const usedInProduction = db.prepare('SELECT SUM(quantity) as total FROM production WHERE preform_product_id = ?').get(preform_product_id) as any;
      
      const purchaseQty = purchases.total || 0;
      const purchasePcs = preform.gram_weight > 0 ? (purchaseQty * 1000) / preform.gram_weight : 0;
      const stock = purchasePcs - (sales.total || 0) - (usedInProduction.total || 0);

      if (Math.floor(stock) < quantity) {
        throw new Error(`Insufficient preform stock. Available: ${Math.floor(stock)} PCS`);
      }

    // 2. Insert production entry
    const stmt = db.prepare(`
      INSERT INTO production (date, preform_product_id, bottle_product_id, quantity, created_by)
      VALUES (?, ?, ?, ?, ?)
    `);
    const result = stmt.run(date, preform_product_id, bottle_product_id, quantity, createdBy);
    return result.lastInsertRowid;
  });

  try {
    const productionId = transaction();
    res.status(201).json({ id: productionId, message: 'Production recorded successfully' });
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Server error' });
  }
});

export { router as productionRoutes };
