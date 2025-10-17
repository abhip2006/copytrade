/**
 * Clear all users from Supabase database
 * This script will delete all data from user-related tables
 *
 * Run with: node --env-file=.env.local --import tsx scripts/clear-users.ts
 * Or: npx tsx scripts/clear-users.ts (make sure .env.local is loaded)
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

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

      const { error, count } = await supabase
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
