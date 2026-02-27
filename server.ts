import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';

// Routes
import { authRoutes } from './server/routes/auth.js';
import { productRoutes } from './server/routes/products.js';
import { supplierRoutes } from './server/routes/suppliers.js';
import { customerRoutes } from './server/routes/customers.js';
import { purchaseRoutes } from './server/routes/purchases.js';
import { salesRoutes } from './server/routes/sales.js';
import { productionRoutes } from './server/routes/production.js';
import { dashboardRoutes } from './server/routes/dashboard.js';
import { reportRoutes } from './server/routes/reports.js';
import { dataRoutes } from './server/routes/data.js';
import { initDb } from './server/db/index.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}
app.use('/uploads', express.static(uploadsDir));

// --- Database Initialization ---
try {
  initDb();
} catch (err) {
  console.error('Database init failed:', err);
}

// --- API Routes ---
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    env: process.env.NODE_ENV,
    vercel: !!process.env.VERCEL
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/production', productionRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/data', dataRoutes);

// --- Vite Middleware for Development ---
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else if (!process.env.VERCEL) {
  // Serve static files in production (only if NOT on Vercel)
  const distPath = path.join(__dirname, 'dist');
  if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      if (req.path.startsWith('/api/')) {
        return res.status(404).json({ message: 'API route not found' });
      }
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }
}

// Only listen if not running as a serverless function
if (!process.env.VERCEL) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

export default app;
