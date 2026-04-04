/**
 * Run database migrations against the configured database.
 * Usage: npm run migrate
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { pool } = require('../config/db');

async function migrate({ closePool = true } = {}) {
  const migrationPath = path.join(__dirname, 'migrations', '001_init.sql');
  const sql = fs.readFileSync(migrationPath, 'utf-8');

  try {
    console.log('[Migrate] Connecting to database...');
    await pool.query(sql);
    console.log('[Migrate] Migration 001_init.sql executed successfully.');
  } catch (err) {
    console.error('[Migrate] Migration failed:', err.message);
    throw err;
  } finally {
    if (closePool) {
      await pool.end();
      console.log('[Migrate] Connection closed.');
    }
  }
}

module.exports = { migrate };

if (require.main === module) {
  migrate().catch(() => process.exit(1));
}
