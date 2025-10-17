/**
 * Migration Script: Encrypt Existing SnapTrade Secrets
 *
 * This script encrypts all existing plaintext snaptrade_user_secret values
 * in the database using the encryption utility.
 *
 * Usage:
 *   npx ts-node scripts/encrypt-existing-secrets.ts
 *
 * Requirements:
 *   - ENCRYPTION_KEY must be set in .env.local
 *   - Supabase credentials must be configured
 */

import { createClient } from '@supabase/supabase-js';
import { encrypt, isEncrypted } from '@/lib/crypto/encryption';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const encryptionKey = process.env.ENCRYPTION_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Supabase credentials not found in environment variables');
  process.exit(1);
}

if (!encryptionKey) {
  console.error('Error: ENCRYPTION_KEY not found in environment variables');
  console.error('Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function encryptExistingSecrets() {
  console.log('Starting encryption of existing SnapTrade secrets...\n');

  try {
    // Fetch all users with SnapTrade credentials
    const { data: users, error: fetchError } = await supabase
      .from('users')
      .select('id, clerk_user_id, snaptrade_user_id, snaptrade_user_secret')
      .not('snaptrade_user_secret', 'is', null);

    if (fetchError) {
      throw new Error(`Failed to fetch users: ${fetchError.message}`);
    }

    if (!users || users.length === 0) {
      console.log('No users with SnapTrade secrets found.');
      return;
    }

    console.log(`Found ${users.length} users with SnapTrade credentials\n`);

    let encryptedCount = 0;
    let alreadyEncryptedCount = 0;
    let errorCount = 0;

    // Process each user
    for (const user of users) {
      const userId = user.clerk_user_id || user.id;
      console.log(`Processing user: ${userId}`);

      // Check if already encrypted
      if (isEncrypted(user.snaptrade_user_secret)) {
        console.log(`  ✓ Already encrypted`);
        alreadyEncryptedCount++;
        continue;
      }

      try {
        // Encrypt the secret
        const encryptedSecret = encrypt(user.snaptrade_user_secret);

        // Update database
        const { error: updateError } = await supabase
          .from('users')
          .update({ snaptrade_user_secret: encryptedSecret })
          .eq('id', user.id);

        if (updateError) {
          throw new Error(`Database update failed: ${updateError.message}`);
        }

        console.log(`  ✓ Encrypted and updated`);
        encryptedCount++;
      } catch (error) {
        console.error(`  ✗ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        errorCount++;
      }
    }

    // Print summary
    console.log('\n' + '='.repeat(50));
    console.log('Migration Summary:');
    console.log('='.repeat(50));
    console.log(`Total users processed:     ${users.length}`);
    console.log(`Newly encrypted:           ${encryptedCount}`);
    console.log(`Already encrypted:         ${alreadyEncryptedCount}`);
    console.log(`Errors:                    ${errorCount}`);
    console.log('='.repeat(50) + '\n');

    if (errorCount > 0) {
      console.warn('⚠️  Some users encountered errors. Please review the logs above.');
      process.exit(1);
    } else {
      console.log('✅ Migration completed successfully!');
      process.exit(0);
    }
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
encryptExistingSecrets();
