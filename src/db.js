import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const isProduction = process.env.NODE_ENV === 'production';

let db;

// Initialize database based on environment
async function initDb() {
  if (isProduction) {
    // Vercel Postgres
    const { sql } = await import('@vercel/postgres');
    db = { sql, type: 'postgres' };

    // Initialize schema for Postgres (adapted for PostgreSQL syntax)
    await sql`
      CREATE TABLE IF NOT EXISTS urls (
        id SERIAL PRIMARY KEY,
        short_code TEXT UNIQUE NOT NULL,
        target_url TEXT NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS clicks (
        id SERIAL PRIMARY KEY,
        url_id INTEGER NOT NULL,
        clicked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        user_agent TEXT,
        referrer TEXT,
        FOREIGN KEY (url_id) REFERENCES urls(id) ON DELETE CASCADE
      )
    `;

    await sql`CREATE INDEX IF NOT EXISTS idx_short_code ON urls(short_code)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_url_id ON clicks(url_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_clicked_at ON clicks(clicked_at)`;

  } else {
    // SQLite for development
    const Database = (await import('better-sqlite3')).default;
    const dbPath = join(__dirname, '../db/database.sqlite');
    db = new Database(dbPath);
    db.type = 'sqlite';

    // Initialize schema from SQL file
    const schema = readFileSync(join(__dirname, '../db/init.sql'), 'utf-8');
    db.exec(schema);
  }

  return db;
}

// Get URL by short code
async function getUrlByShortCode(shortCode) {
  if (db.type === 'postgres') {
    const result = await db.sql`
      SELECT * FROM urls WHERE short_code = ${shortCode}
    `;
    return result.rows[0] || null;
  } else {
    const stmt = db.prepare('SELECT * FROM urls WHERE short_code = ?');
    return stmt.get(shortCode) || null;
  }
}

// Get all URLs with click counts
async function getAllUrls() {
  if (db.type === 'postgres') {
    const result = await db.sql`
      SELECT
        u.id,
        u.short_code,
        u.target_url,
        u.description,
        u.created_at,
        COUNT(c.id) as click_count
      FROM urls u
      LEFT JOIN clicks c ON u.id = c.url_id
      GROUP BY u.id, u.short_code, u.target_url, u.description, u.created_at
      ORDER BY u.created_at DESC
    `;
    return result.rows;
  } else {
    const stmt = db.prepare(`
      SELECT
        u.id,
        u.short_code,
        u.target_url,
        u.description,
        u.created_at,
        COUNT(c.id) as click_count
      FROM urls u
      LEFT JOIN clicks c ON u.id = c.url_id
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `);
    return stmt.all();
  }
}

// Create new URL mapping
async function createUrl(shortCode, targetUrl, description = null) {
  if (db.type === 'postgres') {
    const result = await db.sql`
      INSERT INTO urls (short_code, target_url, description)
      VALUES (${shortCode}, ${targetUrl}, ${description})
      RETURNING *
    `;
    return result.rows[0];
  } else {
    const stmt = db.prepare('INSERT INTO urls (short_code, target_url, description) VALUES (?, ?, ?)');
    const info = stmt.run(shortCode, targetUrl, description);
    return { id: info.lastInsertRowid, short_code: shortCode, target_url: targetUrl, description };
  }
}

// Update URL mapping
async function updateUrl(id, targetUrl, description) {
  if (db.type === 'postgres') {
    const result = await db.sql`
      UPDATE urls
      SET target_url = ${targetUrl}, description = ${description}
      WHERE id = ${id}
      RETURNING *
    `;
    return result.rows[0] || null;
  } else {
    const stmt = db.prepare('UPDATE urls SET target_url = ?, description = ? WHERE id = ?');
    const info = stmt.run(targetUrl, description, id);
    return info.changes > 0;
  }
}

// Delete URL mapping
async function deleteUrl(id) {
  if (db.type === 'postgres') {
    const result = await db.sql`
      DELETE FROM urls WHERE id = ${id}
      RETURNING id
    `;
    return result.rowCount > 0;
  } else {
    const stmt = db.prepare('DELETE FROM urls WHERE id = ?');
    const info = stmt.run(id);
    return info.changes > 0;
  }
}

// Log a click
async function logClick(urlId, userAgent = null, referrer = null) {
  if (db.type === 'postgres') {
    await db.sql`
      INSERT INTO clicks (url_id, user_agent, referrer)
      VALUES (${urlId}, ${userAgent}, ${referrer})
    `;
  } else {
    const stmt = db.prepare('INSERT INTO clicks (url_id, user_agent, referrer) VALUES (?, ?, ?)');
    stmt.run(urlId, userAgent, referrer);
  }
}

// Get statistics for a URL
async function getStats(urlId) {
  if (db.type === 'postgres') {
    const total = await db.sql`
      SELECT COUNT(*) as count FROM clicks WHERE url_id = ${urlId}
    `;

    const byDay = await db.sql`
      SELECT
        DATE(clicked_at) as date,
        COUNT(*) as count
      FROM clicks
      WHERE url_id = ${urlId}
      GROUP BY DATE(clicked_at)
      ORDER BY date DESC
      LIMIT 30
    `;

    return {
      total: parseInt(total.rows[0].count),
      byDay: byDay.rows
    };
  } else {
    const totalStmt = db.prepare('SELECT COUNT(*) as count FROM clicks WHERE url_id = ?');
    const total = totalStmt.get(urlId);

    const byDayStmt = db.prepare(`
      SELECT
        DATE(clicked_at) as date,
        COUNT(*) as count
      FROM clicks
      WHERE url_id = ?
      GROUP BY DATE(clicked_at)
      ORDER BY date DESC
      LIMIT 30
    `);
    const byDay = byDayStmt.all(urlId);

    return {
      total: total.count,
      byDay
    };
  }
}

export {
  initDb,
  getUrlByShortCode,
  getAllUrls,
  createUrl,
  updateUrl,
  deleteUrl,
  logClick,
  getStats
};
