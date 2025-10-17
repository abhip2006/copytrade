/**
 * SnapTrade User Registration API Route
 * Registers a new user with SnapTrade and stores credentials securely
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import { snaptradeService } from '@/lib/snaptrade/client';
import { encrypt, decrypt, isEncrypted } from '@/lib/crypto/encryption';

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user from Clerk
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user already registered with SnapTrade
    const supabase = await createClient();
    const { data: existingUser } = await supabase
      .from('users')
      .select('snaptrade_user_id, snaptrade_user_secret')
      .eq('clerk_user_id', userId)
      .single();

    // If already registered, return existing credentials
    if (existingUser?.snaptrade_user_id && existingUser?.snaptrade_user_secret) {
      // Decrypt secret if it's encrypted (for backward compatibility)
      const userSecret = isEncrypted(existingUser.snaptrade_user_secret)
        ? decrypt(existingUser.snaptrade_user_secret)
        : existingUser.snaptrade_user_secret;

      return NextResponse.json({
        success: true,
        data: {
          userId: existingUser.snaptrade_user_id,
          alreadyRegistered: true,
        },
      });
    }

    // Register new user with SnapTrade
    let snapTradeUser;
    try {
      snapTradeUser = await snaptradeService.registerUser(userId);
    } catch (error: any) {
      // If user already exists in SnapTrade but not in our database
      if (error.code === 'USER_ALREADY_EXISTS' || error.message === 'USER_ALREADY_EXISTS') {
        console.log(`User ${userId} already exists in SnapTrade, attempting to delete and re-register...`);

        // Try to delete the existing user from SnapTrade
        try {
          await snaptradeService.deleteUser(userId);
          console.log(`Successfully deleted user ${userId} from SnapTrade`);

          // Now try to register again
          snapTradeUser = await snaptradeService.registerUser(userId);
          console.log(`Successfully re-registered user ${userId} with SnapTrade`);
        } catch (deleteError) {
          console.error(`Failed to delete/re-register user:`, deleteError);
          return NextResponse.json(
            {
              success: false,
              error: 'User already exists in SnapTrade. Please contact support to resolve this issue.'
            },
            { status: 409 }
          );
        }
      } else {
        // Some other error occurred
        throw error;
      }
    }

    // Encrypt the user secret before storing
    const encryptedSecret = encrypt(snapTradeUser.userSecret);

    // Store SnapTrade credentials in database (upsert to handle new users)
    const { error: upsertError } = await supabase
      .from('users')
      .upsert({
        clerk_user_id: userId,
        snaptrade_user_id: snapTradeUser.userId,
        snaptrade_user_secret: encryptedSecret, // Store encrypted
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'clerk_user_id',
      });

    if (upsertError) {
      console.error('Error storing SnapTrade credentials:', upsertError);
      return NextResponse.json(
        { success: false, error: 'Failed to store credentials' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        userId: snapTradeUser.userId,
        alreadyRegistered: false,
      },
    });
  } catch (error) {
    console.error('Error in SnapTrade registration:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Registration failed',
      },
      { status: 500 }
    );
  }
}
