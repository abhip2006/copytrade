/**
 * SnapTrade Connection Portal API Route
 * Generates OAuth URL for connecting brokerage accounts
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import { snaptradeService } from '@/lib/snaptrade/client';
import { decryptSnapTradeSecret } from '@/lib/snaptrade/credentials';

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

    // Get SnapTrade credentials from database
    const supabase = await createClient();
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('snaptrade_user_id, snaptrade_user_secret')
      .eq('clerk_user_id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    if (!user.snaptrade_user_id || !user.snaptrade_user_secret) {
      return NextResponse.json(
        { success: false, error: 'SnapTrade user not registered' },
        { status: 400 }
      );
    }

    // Parse request body for optional parameters
    const body = await request.json().catch(() => ({}));
    const {
      broker,
      immediateRedirect = true,
      connectionType = 'trade', // 'read' or 'trade'
      reconnect,
    } = body;

    // Decrypt user secret
    const userSecret = decryptSnapTradeSecret(user.snaptrade_user_secret);

    // Get redirect URI from SnapTrade
    // Note: The SDK's loginSnapTradeUser method accepts these parameters
    const redirectUri = await snaptradeService.getRedirectUri(
      user.snaptrade_user_id,
      userSecret
    );

    if (!redirectUri) {
      return NextResponse.json(
        { success: false, error: 'Failed to generate connection URL' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        redirectUri,
        expiresIn: 300, // 5 minutes
      },
    });
  } catch (error) {
    console.error('Error generating SnapTrade connection URL:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Connection failed',
      },
      { status: 500 }
    );
  }
}
