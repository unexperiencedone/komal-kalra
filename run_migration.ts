import fs from 'fs';
import { Client } from 'pg';

async function run() {
  const client = new Client({
    connectionString: process.env.SUPABASE_DB_URL,
  });
  await client.connect();
  try {
    const sql = fs.readFileSync('database/29_booking_contact.sql', 'utf8');
    console.log("Executing 29_booking_contact.sql...");
    await client.query(sql);
    console.log("Success!");
  } catch(e) {
    console.error("Failed:", e);
  } finally {
    await client.end();
  }
}
run();
