import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = process.env.VERCEL 
  ? path.join('/tmp', 'erp.db')
  : path.join(process.cwd(), 'erp.db');

// If on Vercel and db doesn't exist in /tmp, copy it from the project root if it exists
if (process.env.VERCEL && !fs.existsSync(dbPath)) {
  const sourcePath = path.join(process.cwd(), 'erp.db');
  if (fs.existsSync(sourcePath)) {
    try {
      fs.copyFileSync(sourcePath, dbPath);
      console.log('Database copied to /tmp');
    } catch (err) {
      console.error('Failed to copy database:', err);
    }
  }
}

let db: any;
try {
  db = new Database(dbPath);
} catch (err) {
  console.error('Failed to open database:', err);
  // Fallback or dummy db object to prevent crash
  db = {
    pragma: () => {},
    exec: () => {},
    prepare: () => ({
      get: () => ({ count: 0 }),
      run: () => ({ lastInsertRowid: 0 }),
      all: () => []
    })
  };
}

export { db };

export function initDb() {
  // Enable foreign keys
  db.pragma('foreign_keys = ON');

  // Users Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'staff')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Suppliers Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS suppliers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT,
      address TEXT,
      gst TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Customers Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT,
      address TEXT,
      gst TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Products Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL CHECK (category IN ('Preform', 'Bottle', 'Other')),
      gram_weight REAL,
      min_stock_level REAL DEFAULT 0,
      image_url TEXT,
      created_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      is_deleted INTEGER DEFAULT 0,
      FOREIGN KEY (created_by) REFERENCES users (id)
    )
  `);

  // Purchase Master
  db.exec(`
    CREATE TABLE IF NOT EXISTS purchases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_number TEXT UNIQUE NOT NULL,
      date DATE NOT NULL,
      supplier_id INTEGER NOT NULL,
      transport_cost REAL DEFAULT 0,
      image_url TEXT,
      total_amount REAL DEFAULT 0,
      created_by INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      is_deleted INTEGER DEFAULT 0,
      FOREIGN KEY (supplier_id) REFERENCES suppliers (id),
      FOREIGN KEY (created_by) REFERENCES users (id)
    )
  `);

  // Purchase Items
  db.exec(`
    CREATE TABLE IF NOT EXISTS purchase_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      purchase_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity REAL NOT NULL,
      rate REAL NOT NULL,
      total REAL NOT NULL,
      FOREIGN KEY (purchase_id) REFERENCES purchases (id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products (id)
    )
  `);

  // Sales Master
  db.exec(`
    CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_number TEXT UNIQUE NOT NULL,
      date DATE NOT NULL,
      customer_id INTEGER NOT NULL,
      transport_cost REAL DEFAULT 0,
      image_url TEXT,
      total_amount REAL DEFAULT 0,
      created_by INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      is_deleted INTEGER DEFAULT 0,
      FOREIGN KEY (customer_id) REFERENCES customers (id),
      FOREIGN KEY (created_by) REFERENCES users (id)
    )
  `);

  // Sales Items
  db.exec(`
    CREATE TABLE IF NOT EXISTS sales_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sales_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity REAL NOT NULL,
      rate REAL NOT NULL,
      total REAL NOT NULL,
      FOREIGN KEY (sales_id) REFERENCES sales (id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products (id)
    )
  `);

  // Production Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS production (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date DATE NOT NULL,
      preform_product_id INTEGER NOT NULL,
      bottle_product_id INTEGER NOT NULL,
      quantity REAL NOT NULL,
      created_by INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (preform_product_id) REFERENCES products (id),
      FOREIGN KEY (bottle_product_id) REFERENCES products (id),
      FOREIGN KEY (created_by) REFERENCES users (id)
    )
  `);

  // Create indexes for performance
  db.exec(`CREATE INDEX IF NOT EXISTS idx_purchase_invoice ON purchases(invoice_number)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_sales_invoice ON sales(invoice_number)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_products_deleted ON products(is_deleted)`);

  console.log('Database initialized successfully');
}
