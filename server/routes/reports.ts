import express from 'express';
import { db } from '../db/index.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Stock Report
router.get('/stock', authenticate, (req, res) => {
  try {
    const products = db.prepare('SELECT * FROM products WHERE is_deleted = 0').all() as any[];
    const report = products.map(product => {
      const purchases = db.prepare('SELECT SUM(quantity) as total FROM purchase_items WHERE product_id = ?').get(product.id) as any;
      const sales = db.prepare('SELECT SUM(quantity) as total FROM sales_items WHERE product_id = ?').get(product.id) as any;
      
      const purchaseQty = purchases.total || 0;
      const salesQty = sales.total || 0;
      let stock = 0;

      if (product.category === 'Preform') {
        const purchasePcs = product.gram_weight > 0 ? (purchaseQty * 1000) / product.gram_weight : 0;
        const used = db.prepare('SELECT SUM(quantity) as total FROM production WHERE preform_product_id = ?').get(product.id) as any;
        stock = purchasePcs - salesQty - (used.total || 0);
      } else if (product.category === 'Bottle') {
        const produced = db.prepare('SELECT SUM(quantity) as total FROM production WHERE bottle_product_id = ?').get(product.id) as any;
        stock = purchaseQty + (produced.total || 0) - salesQty;
      } else {
        stock = purchaseQty - salesQty;
      }

      const current_stock = Math.floor(stock);
      return {
        ...product,
        current_stock,
        is_low_stock: current_stock < product.min_stock_level
      };
    });
    res.json(report);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Profit & Loss Report
router.get('/profit-loss', authenticate, (req, res) => {
  const { startDate, endDate } = req.query;
  try {
    const salesItems = db.prepare(`
      SELECT si.*, s.date, s.transport_cost as invoice_transport, s.total_amount as invoice_total
      FROM sales_items si
      JOIN sales s ON si.sales_id = s.id
      WHERE s.date BETWEEN ? AND ? AND s.is_deleted = 0
    `).all(startDate, endDate) as any[];

    let totalGrossProfit = 0;
    let totalTransportCost = 0;

    const itemsWithProfit = salesItems.map(item => {
      // Get last purchase rate before sales date
      const lastPurchase = db.prepare(`
        SELECT rate FROM purchase_items pi
        JOIN purchases p ON pi.purchase_id = p.id
        WHERE pi.product_id = ? AND p.date <= ? AND p.is_deleted = 0
        ORDER BY p.date DESC, p.id DESC
        LIMIT 1
      `).get(item.product_id, item.date) as any;

      const lastPurchaseRate = lastPurchase ? lastPurchase.rate : 0;
      const grossProfit = (item.rate - lastPurchaseRate) * item.quantity;
      
      // Distribute transport cost proportionally
      const itemTransport = (item.total / item.invoice_total) * item.invoice_transport;
      
      totalGrossProfit += grossProfit;
      totalTransportCost += itemTransport;

      return {
        ...item,
        last_purchase_rate: lastPurchaseRate,
        gross_profit: grossProfit,
        item_transport: itemTransport,
        net_profit: grossProfit - itemTransport
      };
    });

    res.json({
      items: itemsWithProfit,
      summary: {
        totalGrossProfit,
        totalTransportCost,
        totalNetProfit: totalGrossProfit - totalTransportCost
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export { router as reportRoutes };
