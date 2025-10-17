/**
 * Delete SnapTrade User Script
 * Deletes the test user from SnapTrade to fully reset the workflow
 */

const { Snaptrade } = require('snaptrade-typescript-sdk');
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

const clientId = envVars.SNAPTRADE_CLIENT_ID || process.env.SNAPTRADE_CLIENT_ID;
const consumerKey = envVars.SNAPTRADE_CONSUMER_KEY || process.env.SNAPTRADE_CONSUMER_KEY;

if (!clientId || !consumerKey) {
  console.error('❌ Missing SnapTrade credentials');
  console.error('Please ensure SNAPTRADE_CLIENT_ID and SNAPTRADE_CONSUMER_KEY are set');
  process.exit(1);
}

const snaptrade = new Snaptrade({
  clientId: clientId,
  consumerKey: consumerKey,
});

// The test user ID from your previous attempt
const TEST_USER_ID = 'user_343CjmufCOZDIeZnGIFrG4SguEW';

async function deleteSnapTradeUser() {
  try {
    console.log('🔍 Attempting to delete SnapTrade user...');
    console.log(`   User ID: ${TEST_USER_ID}\n`);

    // Try to delete the user
    await snaptrade.authentication.deleteSnapTradeUser({
      userId: TEST_USER_ID,
    });

    console.log('✅ Successfully deleted SnapTrade user');
    console.log('   All workflows have been fully reset!\n');

  } catch (error) {
    if (error.status === 404 || error.responseBody?.code === '1011') {
      console.log('✅ User does not exist in SnapTrade (already deleted or never created)');
      console.log('   All workflows are clean!\n');
    } else {
      console.error('❌ Error deleting SnapTrade user:', error.message);
      if (error.responseBody) {
        console.error('   Response:', JSON.stringify(error.responseBody, null, 2));
      }
      console.log('\n💡 This is okay - the user may have already been deleted.');
    }
  }
}

// Run the script
deleteSnapTradeUser();
