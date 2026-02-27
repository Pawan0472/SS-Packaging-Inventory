import express from 'express';
import { db } from '../db/index.js';
import { authenticate } from '../middleware/auth.js';
import { startOfMonth, endOfMonth, format } from 'date-fns';

const router = express.Router();

router.get('/stats', authenticate, (req, res) => {
  try {
    const totalProducts = db.prepare('SELECT COUNT(*) as count FROM products WHERE is_deleted = 0').get() as any;
    const totalPurchases = db.prepare('SELECT COUNT(*) as count FROM purchases WHERE is_deleted = 0').get() as any;
    const totalSales = db.prepare('SELECT COUNT(*) as count FROM sales WHERE is_deleted = 0').get() as any;
    const totalProduction = db.prepare('SELECT COUNT(*) as count FROM production').get() as any;

    // Today's stats
    const today = format(new Date(), 'yyyy-MM-dd');
    const todaySales = db.prepare('SELECT SUM(total_amount) as total FROM sales WHERE date = ? AND is_deleted = 0').get(today) as any;
    const todayPurchases = db.prepare('SELECT SUM(total_amount) as total FROM purchases WHERE date = ? AND is_deleted = 0').get(today) as any;

    // Calculate Total Stock Value and Low Stock Alerts
    const products = db.prepare('SELECT id, name, min_stock_level, category FROM products WHERE is_deleted = 0').all() as any[];
    let lowStockCount = 0;
    let totalStockValue = 0;

    for (const product of products) {
      const purchases = db.prepare('SELECT SUM(quantity) as qty FROM purchase_items WHERE product_id = ?').get(product.id) as any;
      const sales = db.prepare('SELECT SUM(quantity) as total FROM sales_items WHERE product_id = ?').get(product.id) as any;
      
      const purchaseQty = purchases.qty || 0;
      const salesQty = sales.total || 0;
      let stock = 0;

      if (product.category === 'Preform') {
        const productData = db.prepare('SELECT gram_weight FROM products WHERE id = ?').get(product.id) as any;
        const purchasePcs = productData.gram_weight > 0 ? (purchaseQty * 1000) / productData.gram_weight : 0;
        const used = db.prepare('SELECT SUM(quantity) as total FROM production WHERE preform_product_id = ?').get(product.id) as any;
        stock = purchasePcs - salesQty - (used.total || 0);
      } else if (product.category === 'Bottle') {
        const produced = db.prepare('SELECT SUM(quantity) as total FROM production WHERE bottle_product_id = ?').get(product.id) as any;
        stock = purchaseQty + (produced.total || 0) - salesQty;
      } else {
        stock = purchaseQty - salesQty;
      }

      if (Math.floor(stock) < product.min_stock_level) {
        lowStockCount++;
      }

      // Get last purchase rate for valuation
      const lastPurchase = db.prepare(`
        SELECT rate FROM purchase_items pi
        JOIN purchases p ON pi.purchase_id = p.id
        WHERE pi.product_id = ? AND p.is_deleted = 0
        ORDER BY p.date DESC, p.id DESC LIMIT 1
      `).get(product.id) as any;
      
      const rate = lastPurchase ? lastPurchase.rate : 0;
      totalStockValue += (stock * rate);
    }

    // Monthly Profit (Simplified Gross Profit for Dashboard)
    const monthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd');
    const monthEnd = format(endOfMonth(new Date()), 'yyyy-MM-dd');
    const monthlySales = db.prepare(`
      SELECT si.*, s.date FROM sales_items si 
      JOIN sales s ON si.sales_id = s.id 
      WHERE s.date BETWEEN ? AND ? AND s.is_deleted = 0
    `).all(monthStart, monthEnd) as any[];

    let monthlyProfit = 0;
    for (const item of monthlySales) {
      const lastP = db.prepare(`
        SELECT rate FROM purchase_items pi JOIN purchases p ON pi.purchase_id = p.id
        WHERE pi.product_id = ? AND p.date <= ? AND p.is_deleted = 0
        ORDER BY p.date DESC LIMIT 1
      `).get(item.product_id, item.date) as any;
      const cost = lastP ? lastP.rate : 0;
      monthlyProfit += (item.rate - cost) * item.quantity;
    }

    res.json({
      totalProducts: totalProducts.count,
      totalPurchases: totalPurchases.count,
      totalSales: totalSales.count,
      totalProduction: totalProduction.count,
      todaySales: todaySales.total || 0,
      todayPurchases: todayPurchases.total || 0,
      lowStockCount,
      totalStockValue,
      monthlyProfit
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/charts', authenticate, (req, res) => {
  try {
    // Last 6 months sales and purchases
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      months.push({
        name: format(date, 'MMM'),
        month: format(date, 'MM'),
        year: format(date, 'yyyy')
      });
    }

    const chartData = months.map(m => {
      const start = `${m.year}-${m.month}-01`;
      const end = `${m.year}-${m.month}-31`;
      
      const sales = db.prepare('SELECT SUM(total_amount) as total FROM sales WHERE date BETWEEN ? AND ? AND is_deleted = 0').get(start, end) as any;
      const purchases = db.prepare('SELECT SUM(total_amount) as total FROM purchases WHERE date BETWEEN ? AND ? AND is_deleted = 0').get(start, end) as any;
      
      return {
        name: m.name,
        sales: sales.total || 0,
        purchases: purchases.total || 0
      };
    });

    res.json(chartData);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export { router as dashboardRoutes };
