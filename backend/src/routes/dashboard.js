import { Router } from 'express';
import db from '../db/connection.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.get('/kpis', (req, res) => {
  try {
    // 1. Total Products
    const totalProducts = db.prepare('SELECT COUNT(*) as count FROM products').get().count;

    // 2. Low Stock / Out of Stock Items
    // A bit complex since we need to join ON HAND quantity.
    const products = db.prepare('SELECT id, min_stock FROM products').all();
    let lowStockCount = 0;

    for (const p of products) {
      const stock = db.prepare(`
        SELECT 
          COALESCE(SUM(CASE WHEN dest.type = 'internal' THEN sm.quantity ELSE 0 END), 0) -
          COALESCE(SUM(CASE WHEN src.type = 'internal' THEN sm.quantity ELSE 0 END), 0) as on_hand
        FROM stock_moves sm
        JOIN locations src ON sm.source_location_id = src.id
        JOIN locations dest ON sm.dest_location_id = dest.id
        WHERE sm.product_id = ?
      `).get(p.id);

      if (stock.on_hand <= (p.min_stock || 0)) {
        lowStockCount++;
      }
    }

    // 3. Pending Receipts
    const pendingReceipts = db.prepare(`
      SELECT COUNT(*) as count FROM operations WHERE type = 'receipt' AND status != 'done' AND status != 'canceled'
    `).get().count;

    // 4. Pending Deliveries
    const pendingDeliveries = db.prepare(`
      SELECT COUNT(*) as count FROM operations WHERE type = 'delivery' AND status != 'done' AND status != 'canceled'
    `).get().count;

    // 5. Internal Transfers Scheduled
    const pendingTransfers = db.prepare(`
      SELECT COUNT(*) as count FROM operations WHERE type = 'transfer' AND status != 'done' AND status != 'canceled'
    `).get().count;

    res.json({
      kpis: {
        totalProducts,
        lowStockCount,
        pendingReceipts,
        pendingDeliveries,
        pendingTransfers
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error fetching KPIs' });
  }
});

export default router;
