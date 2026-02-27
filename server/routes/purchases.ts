import express from 'express';
import { db } from '../db/index.js';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.js';
import { upload } from '../utils/upload.js';

const router = express.Router();

// Get all purchases
router.get('/', authenticate, (req, res) => {
  try {
    const purchases = db.prepare(`
      SELECT p.*, s.name as supplier_name 
      FROM purchases p 
      JOIN suppliers s ON p.supplier_id = s.id 
      WHERE p.is_deleted = 0 
      ORDER BY p.date DESC
    `).all();
    res.json(purchases);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get purchase details
router.get('/:id', authenticate, (req, res) => {
  const { id } = req.params;
  try {
    const purchase = db.prepare(`
      SELECT p.*, s.name as supplier_name 
      FROM purchases p 
      JOIN suppliers s ON p.supplier_id = s.id 
      WHERE p.id = ?
    `).get(id);
    
    const items = db.prepare(`
      SELECT pi.*, pr.name as product_name 
      FROM purchase_items pi 
      JOIN products pr ON pi.product_id = pr.id 
      WHERE pi.purchase_id = ?
    `).all(id);

    res.json({ ...purchase, items });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create purchase
router.post('/', authenticate, upload.single('image'), (req: AuthRequest, res) => {
  const { invoice_number, date, supplier_id, transport_cost, items } = req.body;
  const parsedItems = JSON.parse(items);
  const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
  const createdBy = req.user?.id;

  const transaction = db.transaction(() => {
    // Calculate total amount
    const totalAmount = parsedItems.reduce((sum: number, item: any) => sum + (item.quantity * item.rate), 0) + parseFloat(transport_cost || 0);

    // Insert purchase master
    const stmt = db.prepare(`
      INSERT INTO purchases (invoice_number, date, supplier_id, transport_cost, image_url, total_amount, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(invoice_number, date, supplier_id, transport_cost, imageUrl, totalAmount, createdBy);
    const purchaseId = result.lastInsertRowid;

    // Insert purchase items
    const itemStmt = db.prepare(`
      INSERT INTO purchase_items (purchase_id, product_id, quantity, rate, total)
      VALUES (?, ?, ?, ?, ?)
    `);

    for (const item of parsedItems) {
      itemStmt.run(purchaseId, item.product_id, item.quantity, item.rate, item.quantity * item.rate);
    }

    return purchaseId;
  });

  try {
    const purchaseId = transaction();
    res.status(201).json({ id: purchaseId, message: 'Purchase recorded successfully' });
  } catch (error: any) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(400).json({ message: 'Invoice number already exists' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// Soft delete purchase
router.delete('/:id', authenticate, authorize(['admin']), (req, res) => {
  const { id } = req.params;
  try {
    db.prepare('UPDATE purchases SET is_deleted = 1 WHERE id = ?').run(id);
    res.json({ message: 'Purchase deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export { router as purchaseRoutes };
