const { Pool } = require('pg');
require('dotenv').config({path: '.env.local'});
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {rejectUnauthorized: false}
});
async function run() {
  try {
    const userRes = await pool.query('SELECT * FROM "user"');
    console.log("USER TABLE:", userRes.rows);
    const usersRes = await pool.query('SELECT * FROM users');
    console.log("USERS TABLE:", usersRes.rows);
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}
run();
