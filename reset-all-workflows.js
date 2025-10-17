/**
 * Reset All Workflows Script
 * This will:
 * 1. Delete all users from database
 * 2. Delete all related data (copy relationships, trades, positions, etc.)
 * 3. List SnapTrade users that need manual deletion
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
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function resetAllWorkflows() {
  try {
    console.log('🔍 Checking current database state...\n');

    // Get all users
    const { data: users, error: fetchError } = await supabase
      .from('users')
      .select('*');

    if (fetchError) {
      throw new Error(`Failed to fetch users: ${fetchError.message}`);
    }

    console.log(`📊 Found ${users?.length || 0} user(s) in database`);

    if (!users || users.length === 0) {
      console.log('✅ Database is already clean - no users found');
      console.log('\n📝 All workflows have been reset!');
      return;
    }

    // Display all users and their data
    console.log('\n📋 Users that will be deleted:');
    for (const user of users) {
      console.log(`\n   User: ${user.email || 'No email'}`);
      console.log(`   - Clerk ID: ${user.clerk_user_id}`);
      console.log(`   - Role: ${user.role || 'Not set'}`);
      console.log(`   - Onboarding Completed: ${user.onboarding_completed || false}`);
      if (user.snaptrade_user_id) {
        console.log(`   - SnapTrade User ID: ${user.snaptrade_user_id}`);
      }
      if (user.snaptrade_account_id) {
        console.log(`   - SnapTrade Account ID: ${user.snaptrade_account_id}`);
      }
    }

    // Check related data
    console.log('\n🔍 Checking related data...');

    const { count: copyCount } = await supabase
      .from('copy_relationships')
      .select('*', { count: 'exact', head: true });

    const { count: tradesCount } = await supabase
      .from('leader_trades')
      .select('*', { count: 'exact', head: true });

    const { count: positionsCount } = await supabase
      .from('positions')
      .select('*', { count: 'exact', head: true });

    const { count: profilesCount } = await supabase
      .from('leader_profiles')
      .select('*', { count: 'exact', head: true });

    console.log(`   - Copy Relationships: ${copyCount || 0}`);
    console.log(`   - Leader Trades: ${tradesCount || 0}`);
    console.log(`   - Positions: ${positionsCount || 0}`);
    console.log(`   - Leader Profiles: ${profilesCount || 0}`);

    console.log('\n⚠️  WARNING: This will permanently delete ALL data!');
    console.log('🗑️  Deleting all users and related data...\n');

    // Delete all users (CASCADE will handle related tables)
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (deleteError) {
      throw new Error(`Failed to delete users: ${deleteError.message}`);
    }

    console.log('✅ Successfully deleted all users from database');
    console.log('✅ All related data has been automatically deleted (CASCADE)');

    // List SnapTrade users that need manual deletion
    const snapTradeUsers = users
      .filter(u => u.snaptrade_user_id)
      .map(u => u.snaptrade_user_id);

    if (snapTradeUsers.length > 0) {
      console.log('\n⚠️  SnapTrade Users Need Manual Deletion:');
      console.log('   These users still exist in SnapTrade and should be deleted:');
      snapTradeUsers.forEach(userId => {
        console.log(`   - ${userId}`);
      });
      console.log('\n   Run the following to delete them:');
      console.log(`   node scripts/delete-snaptrade-users.js`);
    } else {
      console.log('\n✅ No SnapTrade users to clean up');
    }

    console.log('\n🎉 All workflows have been reset successfully!');
    console.log('   You can now start fresh with a new "Get Started" workflow');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the script
resetAllWorkflows();
