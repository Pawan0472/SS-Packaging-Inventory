import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

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
const { initDb } = await import('./server/db/index.js');
initDb();

// --- API Routes ---
const { authRoutes } = await import('./server/routes/auth.js');
const { productRoutes } = await import('./server/routes/products.js');
const { supplierRoutes } = await import('./server/routes/suppliers.js');
const { customerRoutes } = await import('./server/routes/customers.js');
const { purchaseRoutes } = await import('./server/routes/purchases.js');
const { salesRoutes } = await import('./server/routes/sales.js');
const { productionRoutes } = await import('./server/routes/production.js');
const { dashboardRoutes } = await import('./server/routes/dashboard.js');
const { reportRoutes } = await import('./server/routes/reports.js');
const { dataRoutes } = await import('./server/routes/data.js');

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
} else {
  // Serve static files in production
  app.use(express.static(path.join(__dirname, 'dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

// Only listen if not running as a serverless function
if (!process.env.VERCEL) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

export default app;
