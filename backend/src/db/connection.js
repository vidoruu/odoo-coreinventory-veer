import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database lives in /backend/data/coreinventory.db
const DB_PATH = path.join(__dirname, '../../data/coreinventory.db');

const db = new Database(DB_PATH);

// Enable WAL mode for better concurrent read performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

console.log(`📦 SQLite database connected at: ${DB_PATH}`);

export default db;
