const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost', port: 5432,
  database: 'farmfresh', user: 'postgres', password: 'admin',
});

async function run() {
  const hash = await bcrypt.hash('mohan.superadmin', 10);
  await pool.query(
    `UPDATE admins SET password = $1, updated_at = NOW() WHERE email = $2`,
    [hash, 'mohan.superadmin@gmail.com']
  );
  console.log('Password updated successfully. Hash:', hash);
  await pool.end();
}

run().catch(e => { console.error(e.message); pool.end(); });
