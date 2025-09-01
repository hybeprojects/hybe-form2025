const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const os = require('os');
let sqlite3; // lazy require
let Pool; // lazy require from pg

// Database paths for SQLite (fallback/local)
const DEFAULT_SQLITE_PATH = path.join(__dirname, '../data/otp_database.db');
const FALLBACK_SQLITE_PATH = path.join(os.tmpdir(), 'otp_database.db');
let SQLITE_DB_PATH = DEFAULT_SQLITE_PATH;
try {
  fs.mkdirSync(path.dirname(DEFAULT_SQLITE_PATH), { recursive: true });
} catch {
  SQLITE_DB_PATH = FALLBACK_SQLITE_PATH;
}
if (process.env.NODE_ENV === 'production') {
  SQLITE_DB_PATH = FALLBACK_SQLITE_PATH;
}

class OTPDatabase {
  constructor() {
    this.driver = process.env.DATABASE_URL ? 'pg' : 'sqlite';
    this.isInitialized = false;
    this.db = null; // sqlite Database instance
    this.pool = null; // pg Pool instance
  }

  async initialize() {
    if (this.isInitialized) return;

    if (this.driver === 'pg') {
      // Initialize Postgres (Neon)
      if (!Pool) ({ Pool } = require('pg'));
      // Neon usually requires SSL
      const sslOption = { rejectUnauthorized: false };
      this.pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.DATABASE_DISABLE_SSL === 'true' ? false : sslOption
      });

      // Test connection and ensure schema
      await this.pool.query('SELECT 1');
      await this.createTables();
      this.isInitialized = true;
      return;
    }

    // Initialize SQLite
    if (!sqlite3) sqlite3 = require('sqlite3').verbose();
    await new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(SQLITE_DB_PATH, (err) => {
        if (err) {
          console.error('Database connection error:', err);
          reject(err);
          return;
        }
        this.createTables()
          .then(() => {
            this.isInitialized = true;
            resolve();
          })
          .catch(reject);
      });
    });
  }

  async createTables() {
    if (this.driver === 'pg') {
      // Postgres schema
      const queries = [
        `CREATE TABLE IF NOT EXISTS otp_codes (
          id SERIAL PRIMARY KEY,
          email TEXT NOT NULL,
          otp_hash TEXT NOT NULL,
          created_at BIGINT NOT NULL,
          expires_at BIGINT NOT NULL,
          attempts INTEGER DEFAULT 0,
          verified BOOLEAN DEFAULT FALSE,
          ip_address TEXT,
          user_agent TEXT,
          salt TEXT NOT NULL
        );`,
        'CREATE INDEX IF NOT EXISTS idx_email_expires ON otp_codes(email, expires_at);',
        'CREATE INDEX IF NOT EXISTS idx_expires_at ON otp_codes(expires_at);',
        'CREATE INDEX IF NOT EXISTS idx_email_verified ON otp_codes(email, verified);',
        `CREATE TABLE IF NOT EXISTS subscriptions (
          id SERIAL PRIMARY KEY,
          subscription_id TEXT UNIQUE NOT NULL,
          owner_name TEXT NOT NULL,
          owner_email TEXT,
          form_data JSONB,
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT NOW()
        );`,
        'CREATE INDEX IF NOT EXISTS idx_subscription_id ON subscriptions (subscription_id);'
      ];
      for (const query of queries) {
        await this.pool.query(query);
      }
      return;
    }

    // SQLite schema
    await new Promise((resolve, reject) => {
      const queries = [
        `CREATE TABLE IF NOT EXISTS otp_codes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT NOT NULL,
          otp_hash TEXT NOT NULL,
          created_at INTEGER NOT NULL,
          expires_at INTEGER NOT NULL,
          attempts INTEGER DEFAULT 0,
          verified BOOLEAN DEFAULT FALSE,
          ip_address TEXT,
          user_agent TEXT,
          salt TEXT NOT NULL
        );`,
        'CREATE INDEX IF NOT EXISTS idx_email_expires ON otp_codes(email, expires_at);',
        'CREATE INDEX IF NOT EXISTS idx_expires_at ON otp_codes(expires_at);',
        'CREATE INDEX IF NOT EXISTS idx_email_verified ON otp_codes(email, verified);',
        `CREATE TABLE IF NOT EXISTS subscriptions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          subscription_id TEXT UNIQUE NOT NULL,
          owner_name TEXT NOT NULL,
          owner_email TEXT,
          form_data TEXT,
          is_active BOOLEAN DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );`,
        'CREATE INDEX IF NOT EXISTS idx_subscription_id ON subscriptions (subscription_id);'
      ];

      this.db.serialize(() => {
        this.db.run('BEGIN TRANSACTION;', (err) => {
          if (err) return reject(err);

          queries.forEach(query => {
            this.db.run(query, (err) => {
              if (err) {
                console.error('Schema creation error:', err);
                // We will attempt to rollback, but reject anyway
                this.db.run('ROLLBACK;', () => reject(err));
              }
            });
          });

          this.db.run('COMMIT;', (err) => {
            if (err) return reject(err);
            console.log('Database tables created/verified successfully.');
            resolve();
          });
        });
      });
    });
  }

  hashOTP(otp, salt) {
    return crypto.pbkdf2Sync(otp, salt, 10000, 64, 'sha512').toString('hex');
  }

  generateSalt() {
    return crypto.randomBytes(32).toString('hex');
  }

  async storeOTP(email, otp, expirationTime, ipAddress = null, userAgent = null) {
    if (!this.isInitialized) await this.initialize();

    // Clean up existing/expired OTPs for this email first
    await this.cleanupExpiredOTPs(email);

    const salt = this.generateSalt();
    const otpHash = this.hashOTP(otp, salt);
    const createdAt = Date.now();

    if (this.driver === 'pg') {
      const query = `
        INSERT INTO otp_codes (email, otp_hash, created_at, expires_at, salt, ip_address, user_agent)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id
      `;
      const res = await this.pool.query(query, [email, otpHash, createdAt, expirationTime, salt, ipAddress, userAgent]);
      const insertedId = res.rows[0]?.id;
      console.log(`OTP stored for email: ${email} (ID: ${insertedId})`);
      return insertedId;
    }

    return await new Promise((resolve, reject) => {
      const query = `
        INSERT INTO otp_codes (email, otp_hash, created_at, expires_at, salt, ip_address, user_agent)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
      this.db.run(query, [email, otpHash, createdAt, expirationTime, salt, ipAddress, userAgent], function(err) {
        if (err) {
          console.error('Error storing OTP:', err);
          reject(err);
          return;
        }
        console.log(`OTP stored for email: ${email} (ID: ${this.lastID})`);
        resolve(this.lastID);
      });
    });
  }

  async verifyOTP(email, otp) {
    if (!this.isInitialized) await this.initialize();

    if (this.driver === 'pg') {
      const selectQ = `
        SELECT id, otp_hash, salt, attempts, expires_at, verified
        FROM otp_codes
        WHERE email = $1 AND verified = FALSE
        ORDER BY created_at DESC
        LIMIT 1
      `;
      const { rows } = await this.pool.query(selectQ, [email]);
      const row = rows[0];
      if (!row) {
        return { success: false, error: 'No verification code found', code: 'OTP_NOT_FOUND' };
      }
      if (Date.now() > Number(row.expires_at)) {
        await this.deleteOTP(row.id);
        return { success: false, error: 'Verification code expired', code: 'OTP_EXPIRED' };
      }
      if (Number(row.attempts) >= 3) {
        await this.deleteOTP(row.id);
        return { success: false, error: 'Too many attempts', code: 'TOO_MANY_ATTEMPTS' };
      }
      const otpHash = this.hashOTP(otp, row.salt);
      if (otpHash !== row.otp_hash) {
        await this.incrementAttempts(row.id);
        const remainingAttempts = 3 - (Number(row.attempts) + 1);
        return {
          success: false,
          error: `Invalid verification code. ${remainingAttempts} attempts remaining.`,
          code: 'INVALID_OTP',
          remainingAttempts
        };
      }
      await this.markAsVerified(row.id);
      return { success: true, message: 'Email verified successfully' };
    }

    // SQLite path
    return await new Promise((resolve, reject) => {
      const query = `
        SELECT id, otp_hash, salt, attempts, expires_at, verified
        FROM otp_codes 
        WHERE email = ? AND verified = FALSE
        ORDER BY created_at DESC 
        LIMIT 1
      `;
      this.db.get(query, [email], (err, row) => {
        if (err) {
          reject(err);
          return;
        }
        if (!row) {
          resolve({ success: false, error: 'No verification code found', code: 'OTP_NOT_FOUND' });
          return;
        }
        if (Date.now() > row.expires_at) {
          this.deleteOTP(row.id);
          resolve({ success: false, error: 'Verification code expired', code: 'OTP_EXPIRED' });
          return;
        }
        if (row.attempts >= 3) {
          this.deleteOTP(row.id);
          resolve({ success: false, error: 'Too many attempts', code: 'TOO_MANY_ATTEMPTS' });
          return;
        }
        const otpHash = this.hashOTP(otp, row.salt);
        if (otpHash !== row.otp_hash) {
          this.incrementAttempts(row.id);
          const remainingAttempts = 3 - (row.attempts + 1);
          resolve({ 
            success: false, 
            error: `Invalid verification code. ${remainingAttempts} attempts remaining.`,
            code: 'INVALID_OTP',
            remainingAttempts
          });
          return;
        }
        this.markAsVerified(row.id).then(() => {
          resolve({ success: true, message: 'Email verified successfully' });
        }).catch(reject);
      });
    });
  }

  async incrementAttempts(otpId) {
    if (this.driver === 'pg') {
      await this.pool.query('UPDATE otp_codes SET attempts = attempts + 1 WHERE id = $1', [otpId]);
      return;
    }
    return await new Promise((resolve, reject) => {
      const query = 'UPDATE otp_codes SET attempts = attempts + 1 WHERE id = ?';
      this.db.run(query, [otpId], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  async markAsVerified(otpId) {
    if (this.driver === 'pg') {
      await this.pool.query('UPDATE otp_codes SET verified = TRUE WHERE id = $1', [otpId]);
      return;
    }
    return await new Promise((resolve, reject) => {
      const query = 'UPDATE otp_codes SET verified = TRUE WHERE id = ?';
      this.db.run(query, [otpId], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  async deleteOTP(otpId) {
    if (this.driver === 'pg') {
      await this.pool.query('DELETE FROM otp_codes WHERE id = $1', [otpId]);
      return;
    }
    return await new Promise((resolve, reject) => {
      const query = 'DELETE FROM otp_codes WHERE id = ?';
      this.db.run(query, [otpId], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  async cleanupExpiredOTPs(email = null) {
    const now = Date.now();
    if (this.driver === 'pg') {
      if (email) {
        // Delete expired OR unverified for this email (to keep only latest)
        const q = 'DELETE FROM otp_codes WHERE expires_at < $1 OR (email = $2 AND verified = FALSE)';
        const res = await this.pool.query(q, [now, email]);
        if (res.rowCount > 0) {
          console.log(`Cleaned up ${res.rowCount} expired/old OTP records`);
        }
        return res.rowCount;
      }
      const q = 'DELETE FROM otp_codes WHERE expires_at < $1';
      const res = await this.pool.query(q, [now]);
      if (res.rowCount > 0) {
        console.log(`Cleaned up ${res.rowCount} expired OTP records`);
      }
      return res.rowCount;
    }

    return await new Promise((resolve, reject) => {
      let query = 'DELETE FROM otp_codes WHERE expires_at < ?';
      let params = [now];
      if (email) {
        query += ' OR (email = ? AND verified = FALSE)';
        params.push(email);
      }
      this.db.run(query, params, function(err) {
        if (err) {
          reject(err);
          return;
        }
        if (this.changes > 0) {
          console.log(`Cleaned up ${this.changes} expired/old OTP records`);
        }
        resolve(this.changes);
      });
    });
  }

  async storeSubscription({ subscription_id, owner_name, owner_email, form_data }) {
    if (!this.isInitialized) await this.initialize();

    if (this.driver === 'pg') {
      const query = `
        INSERT INTO subscriptions (subscription_id, owner_name, owner_email, form_data)
        VALUES ($1, $2, $3, $4)
        RETURNING id
      `;
      // For pg, form_data should be a JS object
      const res = await this.pool.query(query, [subscription_id, owner_name, owner_email, form_data]);
      const insertedId = res.rows[0]?.id;
      console.log(`Subscription stored for ${owner_name} (ID: ${insertedId})`);
      return insertedId;
    }

    return await new Promise((resolve, reject) => {
      const query = `
        INSERT INTO subscriptions (subscription_id, owner_name, owner_email, form_data)
        VALUES (?, ?, ?, ?)
      `;
      // For sqlite, form_data should be a JSON string
      const jsonData = JSON.stringify(form_data);
      this.db.run(query, [subscription_id, owner_name, owner_email, jsonData], function(err) {
        if (err) {
          console.error('Error storing subscription:', err);
          reject(err);
          return;
        }
        console.log(`Subscription stored for ${owner_name} (ID: ${this.lastID})`);
        resolve(this.lastID);
      });
    });
  }

  async getRateLimitInfo(email, timeWindow = 300000) { // 5 minutes
    const cutoff = Date.now() - timeWindow;
    if (this.driver === 'pg') {
      const q = `
        SELECT COUNT(*)::int as count, MAX(created_at)::bigint as lastRequest
        FROM otp_codes
        WHERE email = $1 AND created_at > $2
      `;
      const { rows } = await this.pool.query(q, [email, cutoff]);
      const row = rows[0] || { count: 0, lastRequest: null };
      return row;
    }
    return await new Promise((resolve, reject) => {
      const query = `
        SELECT COUNT(*) as count, MAX(created_at) as lastRequest
        FROM otp_codes 
        WHERE email = ? AND created_at > ?
      `;
      this.db.get(query, [email, cutoff], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  async close() {
    if (this.driver === 'pg' && this.pool) {
      try { await this.pool.end(); } catch { /* ignore */ }
      return;
    }
    if (this.db) {
      return new Promise((resolve) => {
        this.db.close((err) => {
          if (err) console.error('Error closing database:', err);
          else console.log('Database connection closed');
          resolve();
        });
      });
    }
  }

  async performMaintenance() {
    try {
      const cleanedUp = await this.cleanupExpiredOTPs();
      console.log(`Database maintenance: Cleaned up ${cleanedUp} expired OTPs`);
      return cleanedUp;
    } catch (error) {
      console.error('Database maintenance error:', error);
      throw error;
    }
  }
}

// Singleton instance
let dbInstance = null;

function getDatabase() {
  if (!dbInstance) {
    dbInstance = new OTPDatabase();
  }
  return dbInstance;
}

module.exports = {
  getDatabase,
  OTPDatabase
};
