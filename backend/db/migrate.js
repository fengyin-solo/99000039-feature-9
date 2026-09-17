const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'data', 'links.db');

function migrateDatabase() {
  const db = new Database(DB_PATH);
  
  try {
    const tableInfo = db.pragma("table_info(links)");
    const columns = tableInfo.map(col => col.name);
    
    if (!columns.includes('is_read_later')) {
      db.exec('ALTER TABLE links ADD COLUMN is_read_later INTEGER DEFAULT 0');
      console.log('Added column: is_read_later');
    }
    
    if (!columns.includes('review_date')) {
      db.exec('ALTER TABLE links ADD COLUMN review_date DATETIME');
      console.log('Added column: review_date');
    }
    
    if (!columns.includes('review_status')) {
      db.exec("ALTER TABLE links ADD COLUMN review_status TEXT DEFAULT 'pending' CHECK(review_status IN ('pending', 'completed', 'skipped'))");
      console.log('Added column: review_status');
    }

    if (!columns.includes('read_later_added_at')) {
      db.exec('ALTER TABLE links ADD COLUMN read_later_added_at DATETIME');
      console.log('Added column: read_later_added_at');
    }

    if (!columns.includes('last_visited_at')) {
      db.exec('ALTER TABLE links ADD COLUMN last_visited_at DATETIME');
      console.log('Added column: last_visited_at');
    }

    // Backfill the read-later join time for rows added before this migration.
    // It must survive later remove/re-add cycles, so it is stored independently.
    db.exec(`
      UPDATE links
      SET read_later_added_at = REPLACE(created_at, ' ', 'T')
      WHERE is_read_later = 1 AND read_later_added_at IS NULL
    `);
    
    console.log('Database migration completed successfully');
  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    db.close();
  }
}

module.exports = { migrateDatabase };
