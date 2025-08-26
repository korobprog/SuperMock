import { Pool } from 'pg';

// Direct PostgreSQL connection adapter to bypass Prisma Data Proxy issues
class DatabaseAdapter {
  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL || 'postgresql://supermock:krishna1284@localhost:5432/supermock'
    });
  }

  async connect() {
    // Connection pooling handles this automatically
  }

  async disconnect() {
    await this.pool.end();
  }

  async findUserById(id) {
    const result = await this.pool.query(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  async createUser(userData) {
    const { id, tg_id, username, first_name, last_name, photo_url, language } = userData;
    const result = await this.pool.query(
      `INSERT INTO users (id, tg_id, username, first_name, last_name, photo_url, language, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
       ON CONFLICT (id) DO UPDATE SET
       tg_id = $2, username = $3, first_name = $4, last_name = $5, photo_url = $6, language = $7, updated_at = NOW()
       RETURNING *`,
      [id, tg_id, username, first_name, last_name, photo_url, language]
    );
    return result.rows[0];
  }

  async findUserQueues(filters = {}) {
    let query = 'SELECT * FROM user_queues WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (filters.status) {
      query += ` AND status = $${paramIndex}`;
      params.push(filters.status);
      paramIndex++;
    }

    if (filters.slot_utc) {
      query += ` AND slot_utc = $${paramIndex}`;
      params.push(filters.slot_utc);
      paramIndex++;
    }

    query += ' ORDER BY created_at ASC';

    const result = await this.pool.query(query, params);
    return result.rows.map(row => ({
      ...row,
      slotUtc: row.slot_utc,
      userId: row.user_id
    }));
  }

  async findSessions(filters = {}) {
    let query = 'SELECT * FROM sessions WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (filters.status) {
      query += ` AND status = $${paramIndex}`;
      params.push(filters.status);
      paramIndex++;
    }

    const result = await this.pool.query(query, params);
    return result.rows;
  }
}

export const dbAdapter = new DatabaseAdapter();
