import { Client } from 'pg';

// Direct PostgreSQL connection adapter to bypass Prisma Data Proxy issues
class DatabaseAdapter {
  constructor() {
    this.client = new Client({
      connectionString: process.env.DATABASE_URL || 'postgresql://supermock:krishna1284@localhost:5432/supermock'
    });
    this.connected = false;
  }

  async connect() {
    if (!this.connected) {
      await this.client.connect();
      this.connected = true;
    }
  }

  async disconnect() {
    if (this.connected) {
      await this.client.end();
      this.connected = false;
    }
  }

  async findUserById(id) {
    await this.connect();
    const result = await this.client.query(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  async createUser(userData) {
    await this.connect();
    const { id, tg_id, username, first_name, last_name, photo_url, language } = userData;
    const result = await this.client.query(
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
    await this.connect();
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

    const result = await this.client.query(query, params);
    return result.rows.map(row => ({
      ...row,
      slotUtc: row.slot_utc,
      userId: row.user_id
    }));
  }

  async findSessions(filters = {}) {
    await this.connect();
    let query = 'SELECT * FROM sessions WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (filters.status) {
      query += ` AND status = $${paramIndex}`;
      params.push(filters.status);
      paramIndex++;
    }

    const result = await this.client.query(query, params);
    return result.rows;
  }
}

export const dbAdapter = new DatabaseAdapter();
