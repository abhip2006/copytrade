/**
 * SnapTrade Accounts API Route
 * Fetches connected brokerage accounts and stores selected account
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import { snaptradeService } from '@/lib/snaptrade/client';
import { decryptSnapTradeSecret } from '@/lib/snaptrade/credentials';

/**
 * GET - Fetch all connected brokerage accounts for the user
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get SnapTrade credentials
    const supabase = await createClient();
    const { data: user } = await supabase
      .from('users')
      .select('snaptrade_user_id, snaptrade_user_secret')
      .eq('clerk_user_id', userId)
      .single();

    if (!user?.snaptrade_user_id || !user?.snaptrade_user_secret) {
      return NextResponse.json(
        { success: false, error: 'SnapTrade not configured' },
        { status: 400 }
      );
    }

    // Decrypt user secret
    const userSecret = decryptSnapTradeSecret(user.snaptrade_user_secret);

    // Get connected accounts from SnapTrade
    const accounts = await snaptradeService.listUserAccounts(
      user.snaptrade_user_id,
      userSecret
    );

    // Get authorizations to check connection status
    const authorizations = await snaptradeService.listBrokerageAuthorizations(
      user.snaptrade_user_id,
      userSecret
    );

    return NextResponse.json({
      success: true,
      data: {
        accounts,
        authorizations,
        hasConnectedAccounts: accounts.length > 0,
      },
    });
  } catch (error) {
    console.error('Error fetching SnapTrade accounts:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch accounts',
      },
      { status: 500 }
    );
  }
}

/**
 * POST - Select and store primary trading account
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { accountId, authorizationId } = await request.json();

    if (!accountId) {
      return NextResponse.json(
        { success: false, error: 'Account ID is required' },
        { status: 400 }
      );
    }

    // Store selected account in database
    const supabase = await createClient();
    const { error: updateError } = await supabase
      .from('users')
      .update({
        snaptrade_account_id: accountId,
        snaptrade_authorization_id: authorizationId,
        updated_at: new Date().toISOString(),
      })
      .eq('clerk_user_id', userId);

    if (updateError) {
      console.error('Error storing account selection:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to store account' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        accountId,
        authorizationId,
      },
    });
  } catch (error) {
    console.error('Error selecting SnapTrade account:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to select account',
      },
      { status: 500 }
    );
  }
}
