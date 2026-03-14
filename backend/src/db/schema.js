// Schema — all table definitions run once at startup
// Will be expanded per phase as models are finalized.

import db from './connection.js';

const createTables = () => {
  db.exec(`
    -- Users
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'staff',
      otp TEXT,
      otp_expires_at INTEGER,
      created_at INTEGER DEFAULT (unixepoch())
    );

    -- Categories
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      created_at INTEGER DEFAULT (unixepoch())
    );

    -- Locations (physical and virtual)
    CREATE TABLE IF NOT EXISTS locations (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      parent_id TEXT REFERENCES locations(id),
      type TEXT NOT NULL DEFAULT 'internal',
      warehouse_name TEXT,
      created_at INTEGER DEFAULT (unixepoch())
    );

    -- Products
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      sku TEXT NOT NULL UNIQUE,
      category_id TEXT REFERENCES categories(id),
      uom TEXT NOT NULL DEFAULT 'Units',
      min_stock INTEGER DEFAULT 0,
      description TEXT,
      created_at INTEGER DEFAULT (unixepoch())
    );

    -- Operations (Receipts, Deliveries, Transfers, Adjustments)
    CREATE TABLE IF NOT EXISTS operations (
      id TEXT PRIMARY KEY,
      reference TEXT NOT NULL UNIQUE,
      type TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft',
      partner_name TEXT,
      source_location_id TEXT REFERENCES locations(id),
      dest_location_id TEXT REFERENCES locations(id),
      notes TEXT,
      created_at INTEGER DEFAULT (unixepoch()),
      validated_at INTEGER
    );

    -- Operation Lines (products within an operation)
    CREATE TABLE IF NOT EXISTS operation_lines (
      id TEXT PRIMARY KEY,
      operation_id TEXT NOT NULL REFERENCES operations(id) ON DELETE CASCADE,
      product_id TEXT NOT NULL REFERENCES products(id),
      demand_qty REAL NOT NULL DEFAULT 0,
      done_qty REAL NOT NULL DEFAULT 0
    );

    -- Stock Moves (the immutable double-entry ledger)
    CREATE TABLE IF NOT EXISTS stock_moves (
      id TEXT PRIMARY KEY,
      operation_id TEXT REFERENCES operations(id),
      product_id TEXT NOT NULL REFERENCES products(id),
      source_location_id TEXT NOT NULL REFERENCES locations(id),
      dest_location_id TEXT NOT NULL REFERENCES locations(id),
      quantity REAL NOT NULL,
      reference TEXT,
      note TEXT,
      created_at INTEGER DEFAULT (unixepoch())
    );
  `);

  console.log('✅ Database schema initialized successfully.');
};

export default createTables;
