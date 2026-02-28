import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Routes
import { authRoutes } from '../server/routes/auth.js';
import { productRoutes } from '../server/routes/products.js';
import { supplierRoutes } from '../server/routes/suppliers.js';
import { customerRoutes } from '../server/routes/customers.js';
import { purchaseRoutes } from '../server/routes/purchases.js';
import { salesRoutes } from '../server/routes/sales.js';
import { productionRoutes } from '../server/routes/production.js';
import { dashboardRoutes } from '../server/routes/dashboard.js';
import { reportRoutes } from '../server/routes/reports.js';
import { dataRoutes } from '../server/routes/data.js';
import { initDb } from '../server/db/index.js';

// Load environment variables
dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Database Initialization ---
try {
  initDb();
} catch (err) {
  // Silent fail for production
}

// --- API Routes ---
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

export default app;
