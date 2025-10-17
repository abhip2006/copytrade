#!/usr/bin/env node

/**
 * Script to apply database migration to Supabase
 * Adds missing columns to the users table
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Read environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

// Migration SQL
const migrationSQL = `
-- Add missing columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS snaptrade_account_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS snaptrade_authorization_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Add indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_snaptrade_account_id ON users(snaptrade_account_id);
CREATE INDEX IF NOT EXISTS idx_users_onboarding_completed ON users(onboarding_completed);
`;

// Parse Supabase URL to get the database host
const supabaseUrl = new URL(SUPABASE_URL);
const projectRef = supabaseUrl.hostname.split('.')[0];
const dbUrl = `https://${projectRef}.supabase.co/rest/v1/rpc/exec_sql`;

console.log('🔄 Applying database migration...\n');
console.log('Migration SQL:');
console.log(migrationSQL);
console.log('\n');

// Use Supabase REST API to execute SQL
const postData = JSON.stringify({
  query: migrationSQL
});

const url = new URL(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`);

const options = {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': SERVICE_ROLE_KEY,
    'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = https.request(url, options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    if (res.statusCode === 200 || res.statusCode === 204) {
      console.log('✅ Migration applied successfully!');
      console.log('\nAdded columns to users table:');
      console.log('  - snaptrade_account_id (TEXT)');
      console.log('  - snaptrade_authorization_id (TEXT)');
      console.log('  - onboarding_completed (BOOLEAN)');
      console.log('  - avatar_url (TEXT)');
      console.log('\nAdded indexes:');
      console.log('  - idx_users_snaptrade_account_id');
      console.log('  - idx_users_onboarding_completed');
    } else {
      console.error(`❌ Migration failed with status ${res.statusCode}`);
      console.error('Response:', data);

      console.log('\n📋 Manual Migration Required:');
      console.log('Please run the following SQL manually in your Supabase SQL Editor:\n');
      console.log(migrationSQL);
      process.exit(1);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Error applying migration:', error.message);
  console.log('\n📋 Manual Migration Required:');
  console.log('Please run the following SQL manually in your Supabase SQL Editor:\n');
  console.log(migrationSQL);
  console.log('\nTo access SQL Editor:');
  console.log('1. Go to https://supabase.com/dashboard');
  console.log('2. Select your project');
  console.log('3. Click "SQL Editor" in the sidebar');
  console.log('4. Paste and run the SQL above');
  process.exit(1);
});

req.write(postData);
req.end();
