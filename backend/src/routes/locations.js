import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/connection.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

// GET /api/locations
router.get('/', (req, res) => {
  try {
    const locations = db.prepare('SELECT * FROM locations ORDER BY name ASC').all();
    res.json({ locations });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error fetching locations' });
  }
});

// POST /api/locations
router.post('/', (req, res) => {
  try {
    const { name, parent_id, type, warehouse_name } = req.body;
    if (!name || !type) return res.status(400).json({ error: 'Name and type are required' });

    const id = uuidv4();
    db.prepare(`
      INSERT INTO locations (id, name, parent_id, type, warehouse_name)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, name, parent_id || null, type, warehouse_name || null);

    const newLocation = db.prepare('SELECT * FROM locations WHERE id = ?').get(id);
    res.status(201).json({ message: 'Location created', location: newLocation });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error creating location' });
  }
});

// PUT /api/locations/:id
router.put('/:id', (req, res) => {
  try {
    const { name, parent_id, type, warehouse_name } = req.body;
    const { id } = req.params;

    const loc = db.prepare('SELECT id FROM locations WHERE id = ?').get(id);
    if (!loc) return res.status(404).json({ error: 'Location not found' });

    db.prepare(`
      UPDATE locations 
      SET name = COALESCE(?, name),
          parent_id = COALESCE(?, parent_id),
          type = COALESCE(?, type),
          warehouse_name = COALESCE(?, warehouse_name)
      WHERE id = ?
    `).run(name, parent_id, type, warehouse_name, id);

    const updatedLocation = db.prepare('SELECT * FROM locations WHERE id = ?').get(id);
    res.json({ message: 'Location updated', location: updatedLocation });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error updating location' });
  }
});

// DELETE /api/locations/:id
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if location is used
    const usedInMoves = db.prepare(`
      SELECT id FROM stock_moves 
      WHERE source_location_id = ? OR dest_location_id = ? LIMIT 1
    `).get(id, id);
    
    if (usedInMoves) {
      return res.status(400).json({ error: 'Cannot delete location with existing stock moves.' });
    }

    db.prepare('DELETE FROM locations WHERE id = ?').run(id);
    res.json({ message: 'Location deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error deleting location' });
  }
});

export default router;
