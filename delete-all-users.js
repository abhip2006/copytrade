/**
 * Delete All Users Script
 * WARNING: This will permanently delete all users and related data from the database
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};

envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    const value = match[2].trim().replace(/^["']|["']$/g, '');
    envVars[key] = value;
  }
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function deleteAllUsers() {
  try {
    console.log('🔍 Fetching all users...');

    // Get all users
    const { data: users, error: fetchError } = await supabase
      .from('users')
      .select('id, clerk_user_id, email, snaptrade_user_id');

    if (fetchError) {
      throw new Error(`Failed to fetch users: ${fetchError.message}`);
    }

    console.log(`📊 Found ${users?.length || 0} users`);

    if (!users || users.length === 0) {
      console.log('✅ No users to delete');
      return;
    }

    // Display users that will be deleted
    console.log('\n📋 Users to be deleted:');
    users.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.email} (Clerk: ${user.clerk_user_id})`);
      if (user.snaptrade_user_id) {
        console.log(`      SnapTrade: ${user.snaptrade_user_id}`);
      }
    });

    console.log('\n⚠️  WARNING: This will permanently delete all users and related data!');
    console.log('⚠️  This includes: brokerage connections, trades, positions, notifications, etc.');
    console.log('\n🗑️  Deleting all users...');

    // Delete all users (CASCADE will handle related tables)
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all users

    if (deleteError) {
      throw new Error(`Failed to delete users: ${deleteError.message}`);
    }

    console.log('✅ Successfully deleted all users from database');
    console.log('\n📝 Note: SnapTrade users were NOT deleted. If needed, delete them manually via SnapTrade API.');
    console.log('   SnapTrade user IDs that may still exist:');
    users.forEach(user => {
      if (user.snaptrade_user_id) {
        console.log(`   - ${user.snaptrade_user_id}`);
      }
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the script
deleteAllUsers();
