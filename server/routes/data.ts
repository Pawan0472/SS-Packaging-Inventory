import express from 'express';
import { db } from '../db/index.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { Parser } from 'json2csv';
import csv from 'csv-parser';
import { Readable } from 'stream';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();
const upload = multer();

// Backup Database
router.get('/backup', authenticate, authorize(['admin']), (req, res) => {
  const dbPath = path.join(__dirname, '../../erp.db');
  res.download(dbPath);
});

// Export Products to CSV
router.get('/export/products', authenticate, (req, res) => {
  try {
    const products = db.prepare('SELECT * FROM products WHERE is_deleted = 0').all();
    const json2csvParser = new Parser();
    const csvData = json2csvParser.parse(products);
    
    res.header('Content-Type', 'text/csv');
    res.attachment('products_export.csv');
    res.send(csvData);
  } catch (error) {
    res.status(500).json({ message: 'Export failed' });
  }
});

// Import Products from CSV (Tally compatible)
router.post('/import/products', authenticate, authorize(['admin']), upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

  const results: any[] = [];
  const stream = Readable.from(req.file.buffer.toString());

  stream
    .pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', () => {
      const transaction = db.transaction(() => {
        for (const row of results) {
          // Map Tally headers if necessary or use standard ones
          // Expected headers: name, category, gram_weight, min_stock_level
          const name = row.name || row['Item Name'] || row['Product Name'];
          const category = row.category || row['Category'] || 'Other';
          const gram_weight = parseFloat(row.gram_weight || row['Weight'] || 0);
          const min_stock = parseFloat(row.min_stock_level || row['Min Stock'] || 0);

          if (name) {
            db.prepare(`
              INSERT INTO products (name, category, gram_weight, min_stock_level)
              VALUES (?, ?, ?, ?)
            `).run(name, category, gram_weight, min_stock);
          }
        }
      });

      try {
        transaction();
        res.json({ message: `Successfully imported ${results.length} products` });
      } catch (error) {
        res.status(400).json({ message: 'Import failed. Check CSV format.' });
      }
    });
});

// Export Suppliers
router.get('/export/suppliers', authenticate, (req, res) => {
  try {
    const data = db.prepare('SELECT * FROM suppliers WHERE is_deleted = 0').all();
    const json2csvParser = new Parser();
    const csvData = json2csvParser.parse(data);
    res.header('Content-Type', 'text/csv');
    res.attachment('suppliers_export.csv');
    res.send(csvData);
  } catch (error) {
    res.status(500).json({ message: 'Export failed' });
  }
});

// Export Customers
router.get('/export/customers', authenticate, (req, res) => {
  try {
    const data = db.prepare('SELECT * FROM customers WHERE is_deleted = 0').all();
    const json2csvParser = new Parser();
    const csvData = json2csvParser.parse(data);
    res.header('Content-Type', 'text/csv');
    res.attachment('customers_export.csv');
    res.send(csvData);
  } catch (error) {
    res.status(500).json({ message: 'Export failed' });
  }
});

export { router as dataRoutes };
