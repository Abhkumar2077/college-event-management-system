const path = require('path');
const { Pool } = require('pg');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const bcrypt = require('bcryptjs');

let pool;
const PRIMARY_ADMIN_EMAIL = 'bca40569.23@bitmesra.ac.in';

const postgresSchemaStatements = [
  `CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    roll_number TEXT,
    department TEXT,
    year INTEGER,
    phone TEXT,
    role TEXT DEFAULT 'student',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS events (
    id SERIAL PRIMARY KEY,
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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS registrations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    qr_code TEXT,
    attendance_status TEXT DEFAULT 'pending',
    approval_status TEXT DEFAULT 'pending',
    registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    check_in_time TIMESTAMP,
    UNIQUE(user_id, event_id)
  )`,
  `CREATE TABLE IF NOT EXISTS attendance_logs (
    id SERIAL PRIMARY KEY,
    registration_id INTEGER REFERENCES registrations(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
    check_in_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    check_in_method TEXT
  )`
];

const sqliteSchemaStatements = [
  `CREATE TABLE IF NOT EXISTS users (
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
  )`,
  `CREATE TABLE IF NOT EXISTS events (
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
  )`,
  `CREATE TABLE IF NOT EXISTS registrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    event_id INTEGER NOT NULL,
    qr_code TEXT,
    attendance_status TEXT DEFAULT 'pending',
    approval_status TEXT DEFAULT 'pending',
    registration_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    check_in_time DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    UNIQUE(user_id, event_id)
  )`,
  `CREATE TABLE IF NOT EXISTS attendance_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    registration_id INTEGER,
    user_id INTEGER,
    event_id INTEGER,
    check_in_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    check_in_method TEXT,
    FOREIGN KEY (registration_id) REFERENCES registrations(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
  )`
];

const hasPostgresConfig =
  Boolean(process.env.DATABASE_URL) ||
  Boolean(process.env.POSTGRES_URL) ||
  Boolean(process.env.DATABASE_URL_UNPOOLED) ||
  Boolean(process.env.PGHOST) ||
  Boolean(process.env.PGUSER) ||
  Boolean(process.env.PGPASSWORD) ||
  Boolean(process.env.PGDATABASE) ||
  Boolean(process.env.PGPORT);

const normalizeSql = (sql) => sql.replace(/\$(\d+)/g, '?');

async function createSchema(executor) {
  for (const statement of executor.schemaStatements) {
    await executor(statement);
  }
}

async function migrateLegacyAdminEmail(queryFn) {
  const adminResult = await queryFn(
    'SELECT id, email, role FROM users WHERE role = $1 ORDER BY id ASC',
    ['admin']
  );

  if (adminResult.rows.length === 0) {
    return;
  }

  const primaryAdmin = adminResult.rows.find((row) => row.email?.toLowerCase() === PRIMARY_ADMIN_EMAIL.toLowerCase());

  if (!primaryAdmin) {
    const adminToPromote = adminResult.rows[0];
    await queryFn('UPDATE users SET email = $1 WHERE id = $2', [PRIMARY_ADMIN_EMAIL, adminToPromote.id]);
    console.log(`✅ Migrated admin email to ${PRIMARY_ADMIN_EMAIL}`);
    return;
  }

  for (const admin of adminResult.rows) {
    if (admin.id !== primaryAdmin.id && admin.email?.toLowerCase() === PRIMARY_ADMIN_EMAIL.toLowerCase()) {
      await queryFn('UPDATE users SET email = $1 WHERE id = $2', [`legacy-admin-${admin.id}@disabled.local`, admin.id]);
      console.log('✅ Disabled duplicate admin account email');
    }
  }
}

async function initializePostgres() {
  const connectionString =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL_UNPOOLED ||
    `postgres://${process.env.PGUSER || 'postgres'}:${process.env.PGPASSWORD || 'postgres'}@${process.env.PGHOST || 'localhost'}:${process.env.PGPORT || '5432'}/${process.env.PGDATABASE || 'college_event_management'}`;

  const useSsl = Boolean(process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.DATABASE_URL_UNPOOLED);

  const postgresPool = new Pool({
    connectionString,
    ssl: useSsl
      ? {
          rejectUnauthorized: false
        }
      : false
  });

  await postgresPool.query('SELECT 1');
  await createSchema(Object.assign((statement) => postgresPool.query(statement), { schemaStatements: postgresSchemaStatements }));
  await migrateLegacyAdminEmail((sql, params) => postgresPool.query(sql, params));

  const adminCheck = await postgresPool.query('SELECT * FROM users WHERE role = $1', ['admin']);
  if (adminCheck.rows.length === 0) {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await postgresPool.query(
      'INSERT INTO users (email, password, name, role) VALUES ($1, $2, $3, $4)',
      [PRIMARY_ADMIN_EMAIL, hashedPassword, 'Admin User', 'admin']
    );
    console.log(`✅ Admin user created: ${PRIMARY_ADMIN_EMAIL} / admin123`);
  }

  return postgresPool;
}

async function initializeSqlite() {
  const sqliteDb = await open({
    filename: path.join(__dirname, 'database.sqlite'),
    driver: sqlite3.Database
  });

  await createSchema(Object.assign((statement) => sqliteDb.exec(normalizeSql(statement)), { schemaStatements: sqliteSchemaStatements }));

  const query = async (sql, params = []) => {
    const normalizedSql = normalizeSql(sql);
    const trimmedSql = normalizedSql.trim().toUpperCase();
    const hasReturning = /\bRETURNING\b/i.test(normalizedSql);

    if (trimmedSql.startsWith('SELECT') || trimmedSql.startsWith('WITH') || trimmedSql.startsWith('PRAGMA') || hasReturning) {
      const rows = await sqliteDb.all(normalizedSql, params);
      return { rows };
    }

    if (trimmedSql.startsWith('INSERT') || trimmedSql.startsWith('UPDATE') || trimmedSql.startsWith('DELETE')) {
      const result = await sqliteDb.run(normalizedSql, params);
      return { rows: [], rowCount: result.changes, lastID: result.lastID };
    }

    await sqliteDb.exec(normalizedSql);
    return { rows: [] };
  };

  await migrateLegacyAdminEmail((sql, params) => query(sql, params));

  const adminCheck = await query('SELECT * FROM users WHERE role = $1', ['admin']);
  if (adminCheck.rows.length === 0) {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await query(
      'INSERT INTO users (email, password, name, role) VALUES ($1, $2, $3, $4)',
      [PRIMARY_ADMIN_EMAIL, hashedPassword, 'Admin User', 'admin']
    );
    console.log(`✅ Admin user created: ${PRIMARY_ADMIN_EMAIL} / admin123`);
  }

  return {
    query,
    end: () => sqliteDb.close()
  };
}

async function initializeDatabase() {
  if (hasPostgresConfig) {
    try {
      pool = await initializePostgres();
      console.log('✅ PostgreSQL database connected and initialized');
      return pool;
    } catch (error) {
      console.warn('⚠️ PostgreSQL startup failed, falling back to SQLite for local development:', error.message);
    }
  }

  pool = await initializeSqlite();
  console.log('✅ SQLite database connected and initialized');
  return pool;
}

function getDb() {
  if (!pool) {
    throw new Error('Database not initialized. Call initializeDatabase first.');
  }
  return pool;
}

module.exports = { initializeDatabase, getDb };