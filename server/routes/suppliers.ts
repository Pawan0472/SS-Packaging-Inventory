import express from 'express';
import { db } from '../db/index.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticate, (req, res) => {
  try {
    const suppliers = db.prepare('SELECT * FROM suppliers ORDER BY name ASC').all();
    res.json(suppliers);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', authenticate, (req, res) => {
  const { name, phone, address, gst } = req.body;
  try {
    const result = db.prepare('INSERT INTO suppliers (name, phone, address, gst) VALUES (?, ?, ?, ?)').run(name, phone, address, gst);
    res.status(201).json({ id: result.lastInsertRowid, name });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id', authenticate, (req, res) => {
  const { id } = req.params;
  const { name, phone, address, gst } = req.body;
  try {
    db.prepare('UPDATE suppliers SET name = ?, phone = ?, address = ?, gst = ? WHERE id = ?').run(name, phone, address, gst, id);
    res.json({ message: 'Supplier updated' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id', authenticate, authorize(['admin']), (req, res) => {
  const { id } = req.params;
  try {
    db.prepare('DELETE FROM suppliers WHERE id = ?').run(id);
    res.json({ message: 'Supplier deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export { router as supplierRoutes };
