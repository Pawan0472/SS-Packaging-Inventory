import express from 'express';
import { db } from '../db/index.js';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.js';
import { upload } from '../utils/upload.js';

const router = express.Router();

// Get all products (with filters and stock calculation)
router.get('/', authenticate, (req, res) => {
  const { category, search } = req.query;
  let query = 'SELECT * FROM products WHERE is_deleted = 0';
  const params: any[] = [];

  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }
  if (search) {
    query += ' AND name LIKE ?';
    params.push(`%${search}%`);
  }

  query += ' ORDER BY created_at DESC';

  try {
    const products = db.prepare(query).all(...params) as any[];
    
    // Calculate stock for each product
    const productsWithStock = products.map(product => {
      const purchases = db.prepare('SELECT SUM(quantity) as total FROM purchase_items WHERE product_id = ?').get(product.id) as any;
      const sales = db.prepare('SELECT SUM(quantity) as total FROM sales_items WHERE product_id = ?').get(product.id) as any;
      
      let stock = 0;
      const purchaseQty = purchases.total || 0;
      const salesQty = sales.total || 0;

      if (product.category === 'Preform') {
        // Purchases are in KG, convert to PCS: (KG * 1000) / gram_weight
        const purchasePcs = product.gram_weight > 0 ? (purchaseQty * 1000) / product.gram_weight : 0;
        const usedInProduction = db.prepare('SELECT SUM(quantity) as total FROM production WHERE preform_product_id = ?').get(product.id) as any;
        stock = purchasePcs - salesQty - (usedInProduction.total || 0);
      } else if (product.category === 'Bottle') {
        // Purchases are in PCS
        const producedInProduction = db.prepare('SELECT SUM(quantity) as total FROM production WHERE bottle_product_id = ?').get(product.id) as any;
        stock = purchaseQty + (producedInProduction.total || 0) - salesQty;
      } else {
        stock = purchaseQty - salesQty;
      }

      return { ...product, current_stock: Math.floor(stock) };
    });

    res.json(productsWithStock);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create product
router.post('/', authenticate, upload.single('image'), (req: AuthRequest, res) => {
  const { name, category, gram_weight, min_stock_level } = req.body;
  const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
  const createdBy = req.user?.id;

  try {
    const stmt = db.prepare(`
      INSERT INTO products (name, category, gram_weight, min_stock_level, image_url, created_by)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(name, category, gram_weight, min_stock_level, imageUrl, createdBy);
    res.status(201).json({ id: result.lastInsertRowid, name, category });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update product
router.put('/:id', authenticate, upload.single('image'), (req, res) => {
  const { id } = req.params;
  const { name, category, gram_weight, min_stock_level } = req.body;
  const imageUrl = req.file ? `/uploads/${req.file.filename}` : undefined;

  try {
    let query = 'UPDATE products SET name = ?, category = ?, gram_weight = ?, min_stock_level = ?';
    const params = [name, category, gram_weight, min_stock_level];

    if (imageUrl) {
      query += ', image_url = ?';
      params.push(imageUrl);
    }

    query += ' WHERE id = ?';
    params.push(id);

    db.prepare(query).run(...params);
    res.json({ message: 'Product updated' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Soft delete product
router.delete('/:id', authenticate, authorize(['admin']), (req, res) => {
  const { id } = req.params;
  try {
    db.prepare('UPDATE products SET is_deleted = 1 WHERE id = ?').run(id);
    res.json({ message: 'Product deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export { router as productRoutes };
