const sqlite3 = require('sqlite3').verbose();
const crypto = require('crypto');
const path = require('path');

// Database path - use tmp directory for Netlify functions
const DB_PATH = process.env.NODE_ENV === 'production' 
  ? '/tmp/otp_database.db' 
  : path.join(__dirname, '../data/otp_database.db');

class OTPDatabase {
  constructor() {
    this.db = null;
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) return;

    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(DB_PATH, (err) => {
        if (err) {
          console.error('Database connection error:', err);
          reject(err);
          return;
        }
        
        console.log('Connected to SQLite database');
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
    return new Promise((resolve, reject) => {
      const createOTPTable = `
        CREATE TABLE IF NOT EXISTS otp_codes (
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
        )
      `;

      const createIndexes = [
        'CREATE INDEX IF NOT EXISTS idx_email_expires ON otp_codes(email, expires_at)',
        'CREATE INDEX IF NOT EXISTS idx_expires_at ON otp_codes(expires_at)',
        'CREATE INDEX IF NOT EXISTS idx_email_verified ON otp_codes(email, verified)'
      ];

      this.db.run(createOTPTable, (err) => {
        if (err) {
          reject(err);
          return;
        }

        // Create indexes
        let pendingIndexes = createIndexes.length;
        let indexErrors = [];

        createIndexes.forEach(indexQuery => {
          this.db.run(indexQuery, (err) => {
            if (err) indexErrors.push(err);
            pendingIndexes--;
            if (pendingIndexes === 0) {
              if (indexErrors.length > 0) {
                console.warn('Index creation warnings:', indexErrors);
              }
              resolve();
            }
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

    return new Promise((resolve, reject) => {
      // First, clean up any existing OTPs for this email
      this.cleanupExpiredOTPs(email).then(() => {
        
        const salt = this.generateSalt();
        const otpHash = this.hashOTP(otp, salt);
        const createdAt = Date.now();

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
      }).catch(reject);
    });
  }

  async verifyOTP(email, otp) {
    if (!this.isInitialized) await this.initialize();

    return new Promise((resolve, reject) => {
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

        // Check if expired
        if (Date.now() > row.expires_at) {
          this.deleteOTP(row.id);
          resolve({ success: false, error: 'Verification code expired', code: 'OTP_EXPIRED' });
          return;
        }

        // Check attempts limit
        if (row.attempts >= 3) {
          this.deleteOTP(row.id);
          resolve({ success: false, error: 'Too many attempts', code: 'TOO_MANY_ATTEMPTS' });
          return;
        }

        // Verify OTP
        const otpHash = this.hashOTP(otp, row.salt);
        if (otpHash !== row.otp_hash) {
          // Increment attempts
          this.incrementAttempts(row.id);
          const remainingAttempts = 3 - (row.attempts + 1);
          resolve({ 
            success: false, 
            error: `Invalid verification code. ${remainingAttempts} attempts remaining.`,
            code: 'INVALID_OTP',
            remainingAttempts: remainingAttempts
          });
          return;
        }

        // Mark as verified
        this.markAsVerified(row.id).then(() => {
          resolve({ success: true, message: 'Email verified successfully' });
        }).catch(reject);
      });
    });
  }

  async incrementAttempts(otpId) {
    return new Promise((resolve, reject) => {
      const query = 'UPDATE otp_codes SET attempts = attempts + 1 WHERE id = ?';
      this.db.run(query, [otpId], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  async markAsVerified(otpId) {
    return new Promise((resolve, reject) => {
      const query = 'UPDATE otp_codes SET verified = TRUE WHERE id = ?';
      this.db.run(query, [otpId], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  async deleteOTP(otpId) {
    return new Promise((resolve, reject) => {
      const query = 'DELETE FROM otp_codes WHERE id = ?';
      this.db.run(query, [otpId], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  async cleanupExpiredOTPs(email = null) {
    return new Promise((resolve, reject) => {
      const now = Date.now();
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

  async getRateLimitInfo(email, timeWindow = 300000) { // 5 minutes
    return new Promise((resolve, reject) => {
      const cutoff = Date.now() - timeWindow;
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

  // Cleanup function for expired OTPs (should be run periodically)
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
