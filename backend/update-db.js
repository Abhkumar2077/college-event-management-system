const { Pool } = require('pg');

const pool = new Pool({
  user: 'college_event_db_75m0_user',
  password: 'Xj6zERmcmpN55s3jltNGA3teucFtXO9M',
  host: 'dpg-d7cc4sjbc2fs73eruk5g-a.singapore-postgres.render.com',
  port: 5432,
  database: 'college_event_db_75m0',
  ssl: { rejectUnauthorized: false }
});

async function updateDatabase() {
  try {
    console.log('🔧 Connecting to database...');
    
    console.log('📝 Adding approval_status column...');
    await pool.query(`
      ALTER TABLE registrations 
      ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending'
    `);
    console.log('✅ Column added successfully');
    
    console.log('📝 Updating existing records...');
    await pool.query(`
      UPDATE registrations SET approval_status = 'approved' 
      WHERE approval_status IS NULL
    `);
    console.log('✅ Existing records updated to approved');
    
    console.log('\n🎉 Database update completed!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

updateDatabase();