import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/connection.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Apply auth middleware to all product routes
router.use(requireAuth);

// GET /api/products
// Fetch all products with their current on-hand stock
router.get('/', (req, res) => {
  try {
    const products = db.prepare(`
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ORDER BY p.name ASC
    `).all();

    // Calculate on-hand stock for each product
    // On-hand = Sum of moves into 'internal' locations - Sum of moves out of 'internal' locations
    for (let product of products) {
      const stock = db.prepare(`
        SELECT 
          COALESCE(SUM(CASE WHEN dest.type = 'internal' THEN sm.quantity ELSE 0 END), 0) -
          COALESCE(SUM(CASE WHEN src.type = 'internal' THEN sm.quantity ELSE 0 END), 0) as on_hand
        FROM stock_moves sm
        JOIN locations src ON sm.source_location_id = src.id
        JOIN locations dest ON sm.dest_location_id = dest.id
        WHERE sm.product_id = ?
      `).get(product.id);

      product.on_hand = stock.on_hand || 0;
    }

    res.json({ products });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error fetching products' });
  }
});

// GET /api/products/categories
router.get('/categories', (req, res) => {
  try {
    const categories = db.prepare('SELECT * FROM categories ORDER BY name ASC').all();
    res.json({ categories });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error fetching categories' });
  }
});

// POST /api/products
router.post('/', (req, res) => {
  try {
    const { name, sku, category_id, uom, min_stock, description, initial_stock } = req.body;
    if (!name || !sku) return res.status(400).json({ error: 'Name and SKU are required' });

    // Check if SKU exists
    const existing = db.prepare('SELECT id FROM products WHERE sku = ?').get(sku);
    if (existing) return res.status(400).json({ error: 'Product with this SKU already exists' });

    let catId = category_id;
    if (!catId) {
      // Find "General" category
      const genCat = db.prepare("SELECT id FROM categories WHERE name = 'General'").get();
      catId = genCat ? genCat.id : null;
    }

    const id = uuidv4();
    
    // Start transaction to handle both product creation and initial stock adjustment safely
    const createProductTx = db.transaction(() => {
      db.prepare(`
        INSERT INTO products (id, name, sku, category_id, uom, min_stock, description)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(id, name, sku, catId, uom || 'Units', min_stock || 0, description || '');

      // Handle Initial Stock Setup
      const startingStock = parseFloat(initial_stock) || 0;
      if (startingStock > 0) {
        // Find Inventory Loss (Virtual Location) and Main Warehouse (Internal Location)
        const vLoc = db.prepare(`SELECT id FROM locations WHERE name = 'Inventory Loss'`).get();
        const mainWh = db.prepare(`SELECT id FROM locations WHERE name = 'Main Warehouse'`).get();
        
        if (vLoc && mainWh) {
          const opId = uuidv4();
          const ref = `ADJ-INIT-${Date.now().toString().slice(-4)}`;

          // Create finalized adjustment operation
          db.prepare(`
            INSERT INTO operations (id, reference, type, status, source_location_id, dest_location_id, notes, validated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, unixepoch())
          `).run(opId, ref, 'adjustment', 'done', vLoc.id, mainWh.id, `Initial stock setup for ${name}`);

          // Insert operation line
          db.prepare(`
            INSERT INTO operation_lines (id, operation_id, product_id, demand_qty, done_qty)
            VALUES (?, ?, ?, ?, ?)
          `).run(uuidv4(), opId, id, startingStock, startingStock);

          // Add a stock move ledger entry to actually establish on-hand quantity
          db.prepare(`
            INSERT INTO stock_moves (id, operation_id, product_id, source_location_id, dest_location_id, quantity, reference, note)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `).run(uuidv4(), opId, id, vLoc.id, mainWh.id, startingStock, ref, 'Initial Stock Registration');
        }
      }
    });

    createProductTx();

    const newProduct = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
    res.status(201).json({ message: 'Product created', product: newProduct });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error creating product' });
  }
});

// GET /api/products/:id
router.get('/:id', (req, res) => {
  try {
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json({ product });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error fetching product' });
  }
});

// PUT /api/products/:id
router.put('/:id', (req, res) => {
  try {
    const { name, sku, category_id, uom, min_stock, description } = req.body;
    const { id } = req.params;

    const product = db.prepare('SELECT id FROM products WHERE id = ?').get(id);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    // Check if new SKU belongs to another product
    if (sku) {
      const existing = db.prepare('SELECT id FROM products WHERE sku = ? AND id != ?').get(sku, id);
      if (existing) return res.status(400).json({ error: 'SKU already in use' });
    }

    db.prepare(`
      UPDATE products 
      SET name = COALESCE(?, name),
          sku = COALESCE(?, sku),
          category_id = COALESCE(?, category_id),
          uom = COALESCE(?, uom),
          min_stock = COALESCE(?, min_stock),
          description = COALESCE(?, description)
      WHERE id = ?
    `).run(name, sku, category_id, uom, min_stock, description, id);

    const updatedProduct = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
    res.json({ message: 'Product updated', product: updatedProduct });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error updating product' });
  }
});

// DELETE /api/products/:id
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if product is used in any stock moves or operations
    const usedInMoves = db.prepare('SELECT id FROM stock_moves WHERE product_id = ? LIMIT 1').get(id);
    if (usedInMoves) {
      return res.status(400).json({ error: 'Cannot delete product with existing stock moves. Consider archiving instead (not implemented).' });
    }

    db.prepare('DELETE FROM products WHERE id = ?').run(id);
    res.json({ message: 'Product deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error deleting product' });
  }
});

export default router;
