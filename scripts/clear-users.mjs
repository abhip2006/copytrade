/**
 * Clear all users from Supabase database
 * Run with: node scripts/clear-users.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env.local
const envPath = join(__dirname, '..', '.env.local');
const envContent = readFileSync(envPath, 'utf-8');

const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=:#]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    const value = match[2].trim().replace(/^["']|["']$/g, '');
    envVars[key] = value;
  }
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function clearAllUsers() {
  try {
    console.log('🗑️  Starting database cleanup...\n');

    // Delete in order of foreign key dependencies
    const tables = [
      'notifications',
      'copy_relationships',
      'leader_trades',
      'users',
    ];

    for (const table of tables) {
      console.log(`Deleting all records from ${table}...`);

      const { error } = await supabase
        .from(table)
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records

      if (error) {
        console.error(`❌ Error deleting from ${table}:`, error.message);
      } else {
        console.log(`✅ Deleted all records from ${table}`);
      }
    }

    console.log('\n✨ Database cleanup complete!');
    console.log('\n📝 Next steps:');
    console.log('1. Go to your Clerk Dashboard: https://dashboard.clerk.com');
    console.log('2. Navigate to Users section');
    console.log('3. Delete all test users manually');
    console.log('4. Create new test accounts through your app\n');

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  }
}

clearAllUsers();
