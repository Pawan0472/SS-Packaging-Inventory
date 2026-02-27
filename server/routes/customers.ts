import express from 'express';
import { db } from '../db/index.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticate, (req, res) => {
  try {
    const customers = db.prepare('SELECT * FROM customers ORDER BY name ASC').all();
    res.json(customers);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', authenticate, (req, res) => {
  const { name, phone, address, gst } = req.body;
  try {
    const result = db.prepare('INSERT INTO customers (name, phone, address, gst) VALUES (?, ?, ?, ?)').run(name, phone, address, gst);
    res.status(201).json({ id: result.lastInsertRowid, name });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id', authenticate, (req, res) => {
  const { id } = req.params;
  const { name, phone, address, gst } = req.body;
  try {
    db.prepare('UPDATE customers SET name = ?, phone = ?, address = ?, gst = ? WHERE id = ?').run(name, phone, address, gst, id);
    res.json({ message: 'Customer updated' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id', authenticate, authorize(['admin']), (req, res) => {
  const { id } = req.params;
  try {
    db.prepare('DELETE FROM customers WHERE id = ?').run(id);
    res.json({ message: 'Customer deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export { router as customerRoutes };
