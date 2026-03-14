// Seed script — bootstraps required system locations and a default admin user
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import db from './connection.js';
import createTables from './schema.js';

const seed = () => {
  createTables();

  // --- System Locations ---
  const locationSeeds = [
    { id: uuidv4(), name: 'Vendors', type: 'supplier', parent_id: null, warehouse_name: null },
    { id: uuidv4(), name: 'Customers', type: 'customer', parent_id: null, warehouse_name: null },
    { id: uuidv4(), name: 'Inventory Loss', type: 'virtual', parent_id: null, warehouse_name: null },
    { id: uuidv4(), name: 'Main Warehouse', type: 'internal', parent_id: null, warehouse_name: 'Main Warehouse' },
  ];

  const insertLocation = db.prepare(`
    INSERT OR IGNORE INTO locations (id, name, type, parent_id, warehouse_name)
    VALUES (@id, @name, @type, @parent_id, @warehouse_name)
  `);

  for (const loc of locationSeeds) {
    insertLocation.run(loc);
  }

  // Find main warehouse to add a child rack
  const mainWarehouse = db.prepare(`SELECT id FROM locations WHERE name = 'Main Warehouse'`).get();
  if (mainWarehouse) {
    insertLocation.run({
      id: uuidv4(),
      name: 'Production Rack',
      type: 'internal',
      parent_id: mainWarehouse.id,
      warehouse_name: 'Main Warehouse',
    });
  }

  // --- Default Category ---
  db.prepare(`INSERT OR IGNORE INTO categories (id, name, description) VALUES (?, ?, ?)`)
    .run(uuidv4(), 'General', 'Default product category');

  // --- Default Admin User ---
  const existingAdmin = db.prepare(`SELECT id FROM users WHERE username = ?`).get('admin');
  if (!existingAdmin) {
    const hash = bcrypt.hashSync('Admin@123', 10);
    db.prepare(`INSERT INTO users (id, name, username, password_hash, role) VALUES (?, ?, ?, ?, ?)`)
      .run(uuidv4(), 'Admin', 'admin', hash, 'manager');
    console.log(' Default admin created: admin / Admin@123');
  }

  console.log(' Seed complete.');
};

seed();
