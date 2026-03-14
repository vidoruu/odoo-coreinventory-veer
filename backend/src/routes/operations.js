import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/connection.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

// GET /api/operations
router.get('/', (req, res) => {
  try {
    const { type, status } = req.query;
    let query = `
      SELECT o.*, 
             src.name as source_location_name,
             dest.name as dest_location_name
      FROM operations o
      LEFT JOIN locations src ON o.source_location_id = src.id
      LEFT JOIN locations dest ON o.dest_location_id = dest.id
      WHERE 1=1
    `;
    const params = [];

    if (type) {
      query += ` AND o.type = ?`;
      params.push(type);
    }
    if (status) {
      query += ` AND o.status = ?`;
      params.push(status);
    }
    
    query += ` ORDER BY o.created_at DESC`;

    const operations = db.prepare(query).all(...params);
    res.json({ operations });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error fetching operations' });
  }
});

// POST /api/operations
router.post('/', (req, res) => {
  try {
    // Generate reference like WH/IN/0001
    const { type, partner_name, source_location_id, dest_location_id, notes, lines } = req.body;
    
    if (!type || !source_location_id || !dest_location_id) {
      return res.status(400).json({ error: 'Type, source, and destination locations are required' });
    }

    // Auto-generate reference based on type
    const prefixMap = {
      'receipt': 'WH/IN/',
      'delivery': 'WH/OUT/',
      'transfer': 'WH/INT/',
      'adjustment': 'WH/ADJ/'
    };
    const prefix = prefixMap[type] || 'WH/OP/';
    const countQuery = db.prepare('SELECT COUNT(*) as count FROM operations WHERE type = ?').get(type);
    const nextNum = String(countQuery.count + 1).padStart(4, '0');
    const reference = `${prefix}${nextNum}`;

    const opId = uuidv4();
    
    // Begin transaction
    const insertOp = db.transaction((opId, reference, type, partner_name, src, dest, notes, lines) => {
      db.prepare(`
        INSERT INTO operations (id, reference, type, partner_name, source_location_id, dest_location_id, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(opId, reference, type, partner_name, src, dest, notes);

      if (lines && lines.length > 0) {
        const insertLine = db.prepare(`
          INSERT INTO operation_lines (id, operation_id, product_id, demand_qty, done_qty)
          VALUES (?, ?, ?, ?, ?)
        `);
        for (const line of lines) {
          if (!line.product_id || line.demand_qty <= 0) continue;
          insertLine.run(
            uuidv4(), 
            opId, 
            line.product_id, 
            line.demand_qty, 
            line.done_qty !== undefined ? line.done_qty : 0
          );
        }
      }
    });

    insertOp(opId, reference, type, partner_name || null, source_location_id, dest_location_id, notes || null, lines);
    
    // Fetch inserted operation
    const newOp = db.prepare('SELECT * FROM operations WHERE id = ?').get(opId);
    res.status(201).json({ message: 'Operation created', operation: newOp });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error creating operation' });
  }
});

// GET /api/operations/:id
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const operation = db.prepare(`
      SELECT o.*, 
             src.name as source_location_name,
             dest.name as dest_location_name
      FROM operations o
      LEFT JOIN locations src ON o.source_location_id = src.id
      LEFT JOIN locations dest ON o.dest_location_id = dest.id
      WHERE o.id = ?
    `).get(id);

    if (!operation) return res.status(404).json({ error: 'Operation not found' });

    const lines = db.prepare(`
      SELECT ol.*, p.name as product_name, p.uom, p.sku
      FROM operation_lines ol
      JOIN products p ON ol.product_id = p.id
      WHERE ol.operation_id = ?
    `).all(id);

    operation.lines = lines;
    res.json({ operation });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error fetching operation details' });
  }
});

// PUT /api/operations/:id
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { partner_name, source_location_id, dest_location_id, notes, status, lines } = req.body;

    const op = db.prepare('SELECT id, status FROM operations WHERE id = ?').get(id);
    if (!op) return res.status(404).json({ error: 'Operation not found' });
    if (op.status === 'done') return res.status(400).json({ error: 'Cannot edit validated operations' });

    const updateTransaction = db.transaction(() => {
      // Update header
      db.prepare(`
        UPDATE operations 
        SET partner_name = COALESCE(?, partner_name),
            source_location_id = COALESCE(?, source_location_id),
            dest_location_id = COALESCE(?, dest_location_id),
            notes = COALESCE(?, notes),
            status = COALESCE(?, status)
        WHERE id = ?
      `).run(partner_name, source_location_id, dest_location_id, notes, status, id);

      // Replace lines if provided
      if (lines) {
        db.prepare('DELETE FROM operation_lines WHERE operation_id = ?').run(id);
        const insertLine = db.prepare(`
          INSERT INTO operation_lines (id, operation_id, product_id, demand_qty, done_qty)
          VALUES (?, ?, ?, ?, ?)
        `);
        for (const line of lines) {
          if (!line.product_id || line.demand_qty <= 0) continue;
          insertLine.run(
            uuidv4(), 
            id, 
            line.product_id, 
            line.demand_qty, 
            line.done_qty !== undefined ? line.done_qty : (line.demand_qty || 0) // if ready, often done_qty = demand_qty
          );
        }
      }
    });

    updateTransaction();

    res.json({ message: 'Operation updated' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error updating operation' });
  }
});

// POST /api/operations/:id/validate
router.post('/:id/validate', (req, res) => {
  try {
    const { id } = req.params;
    
    const op = db.prepare('SELECT * FROM operations WHERE id = ?').get(id);
    if (!op) return res.status(404).json({ error: 'Operation not found' });
    if (op.status === 'done') return res.status(400).json({ error: 'Operation is already validated' });

    const lines = db.prepare('SELECT * FROM operation_lines WHERE operation_id = ?').all(id);
    
    const validateTransaction = db.transaction(() => {
      // 1. Mark as done
      db.prepare(`
        UPDATE operations 
        SET status = 'done', validated_at = (unixepoch()) 
        WHERE id = ?
      `).run(id);

      // 2. Create stock moves for each line where done_qty > 0
      const insertMove = db.prepare(`
        INSERT INTO stock_moves (id, operation_id, product_id, source_location_id, dest_location_id, quantity, reference)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      for (const line of lines) {
        if (line.done_qty > 0) {
          insertMove.run(
            uuidv4(),
            id,
            line.product_id,
            op.source_location_id,
            op.dest_location_id,
            line.done_qty,
            op.reference
          );
        } else if (line.demand_qty > 0 && op.type !== 'adjustment') {
          // If they validate without setting done_qty, we assume demand_qty is done_qty
           insertMove.run(
            uuidv4(),
            id,
            line.product_id,
            op.source_location_id,
            op.dest_location_id,
            line.demand_qty,
            op.reference
          );
          // Also update the line to reflect done_qty = demand_qty
          db.prepare('UPDATE operation_lines SET done_qty = demand_qty WHERE id = ?').run(line.id);
        }
      }
    });

    validateTransaction();
    res.json({ message: 'Operation validated and stock updated' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error validating operation' });
  }
});

export default router;
