const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');
const bcrypt = require('bcryptjs');

let db;

async function initializeDatabase() {
  try {
    db = await open({
      filename: path.join(__dirname, 'database.sqlite'),
      driver: sqlite3.Database
    });

    // Create tables
    await db.exec(`
      -- Users table
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        roll_number TEXT,
        department TEXT,
        year INTEGER,
        phone TEXT,
        role TEXT DEFAULT 'student',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Events table
      CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        category TEXT,
        venue TEXT,
        capacity INTEGER,
        date DATE,
        register_till DATE,
        register_till_time TEXT,
        time TEXT,
        coordinator TEXT,
        coordinator_email TEXT,
        status TEXT DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Registrations table
      CREATE TABLE IF NOT EXISTS registrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        event_id INTEGER NOT NULL,
        qr_code TEXT,
        attendance_status TEXT DEFAULT 'pending',
        approval_status TEXT DEFAULT 'pending',
        registration_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        check_in_time DATETIME,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (event_id) REFERENCES events(id),
        UNIQUE(user_id, event_id)
      );

      -- Attendance logs table
      CREATE TABLE IF NOT EXISTS attendance_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        registration_id INTEGER,
        user_id INTEGER,
        event_id INTEGER,
        check_in_time DATETIME DEFAULT CURRENT_TIMESTAMP,
        check_in_method TEXT,
        FOREIGN KEY (registration_id) REFERENCES registrations(id),
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (event_id) REFERENCES events(id)
      );
    `);

    // Check if admin exists, if not create one
    const admin = await db.get('SELECT * FROM users WHERE role = ?', ['admin']);
    if (!admin) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await db.run(
        'INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)',
        ['admin@college.edu', hashedPassword, 'Admin User', 'admin']
      );
      console.log('✅ Admin user created: admin@college.edu / admin123');
    }

    // Add approval_status column if it doesn't exist (migration)
    try {
      await db.exec(`
        ALTER TABLE registrations ADD COLUMN approval_status TEXT DEFAULT 'pending';
      `);
      console.log('✅ Added approval_status column to registrations');
    } catch (error) {
      // Column likely already exists, ignore error
      if (!error.message.includes('duplicate column')) {
        console.warn('Migration warning:', error.message);
      }
    }

    // Add register_till column if it doesn't exist (migration)
    try {
      await db.exec(`
        ALTER TABLE events ADD COLUMN register_till DATE;
      `);
      console.log('✅ Added register_till column to events');
    } catch (error) {
      // Column likely already exists, ignore error
      if (!error.message.includes('duplicate column')) {
        console.warn('Migration warning:', error.message);
      }
    }

    // Add register_till_time column if it doesn't exist (migration)
    try {
      await db.exec(`
        ALTER TABLE events ADD COLUMN register_till_time TEXT;
      `);
      console.log('✅ Added register_till_time column to events');
    } catch (error) {
      // Column likely already exists, ignore error
      if (!error.message.includes('duplicate column')) {
        console.warn('Migration warning:', error.message);
      }
    }

    console.log('✅ Database initialized successfully');
    return db;
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
}

function getDb() {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase first.');
  }
  return db;
}

module.exports = { initializeDatabase, getDb };