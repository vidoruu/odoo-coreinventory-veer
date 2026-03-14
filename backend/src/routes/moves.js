import { Router } from 'express';
import db from '../db/connection.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

// GET /api/moves
router.get('/', (req, res) => {
  try {
    const moves = db.prepare(`
      SELECT sm.*, 
             p.name as product_name,
             src.name as source_location_name,
             dest.name as dest_location_name,
             o.reference as operation_reference
      FROM stock_moves sm
      JOIN products p ON sm.product_id = p.id
      JOIN locations src ON sm.source_location_id = src.id
      JOIN locations dest ON sm.dest_location_id = dest.id
      LEFT JOIN operations o ON sm.operation_id = o.id
      ORDER BY sm.created_at DESC
    `).all();

    res.json({ moves });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error fetching stock moves' });
  }
});

export default router;
