/**
 * API Route: Get SnapTrade Connection URL
 * Returns the redirect URL for users to connect their brokerage account
 */

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { snaptradeService } from '@/lib/snaptrade/client';

export const runtime = 'nodejs';

/**
 * GET /api/connect/redirect
 * Get the SnapTrade connection portal URL
 */
export async function GET() {
  try {
    // Get authenticated user
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = createServiceRoleClient();

    // Get or create user in Supabase
    // @ts-ignore - Supabase type inference issue
    let { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('clerk_user_id', clerkUserId)
      .single();

    // If user doesn't exist yet, get Clerk user info and create
    if (userError || !user) {
      // For now, create minimal user record
      // In production, sync with Clerk user data
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          clerk_user_id: clerkUserId,
          email: `user-${clerkUserId}@temp.com`, // Will be updated from Clerk
          role: 'follower',
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating user:', createError);
        return NextResponse.json(
          { error: 'Failed to create user' },
          { status: 500 }
        );
      }

      user = newUser;
    }

    // Register with SnapTrade if not already registered
    if (!user.snaptrade_user_id) {
      try {
        const snapTradeUser = await snaptradeService.registerUser(clerkUserId);

        // Update user with SnapTrade credentials
        const { error: updateError } = await supabase
          .from('users')
          .update({
            snaptrade_user_id: snapTradeUser.userId,
            snaptrade_user_secret: snapTradeUser.userSecret, // TODO: Encrypt this
          })
          .eq('id', user.id);

        if (updateError) {
          console.error('Error updating SnapTrade credentials:', updateError);
          return NextResponse.json(
            { error: 'Failed to save SnapTrade credentials' },
            { status: 500 }
          );
        }

        user.snaptrade_user_id = snapTradeUser.userId;
        user.snaptrade_user_secret = snapTradeUser.userSecret;
      } catch (error) {
        console.error('Error registering with SnapTrade:', error);
        return NextResponse.json(
          { error: 'Failed to register with SnapTrade' },
          { status: 500 }
        );
      }
    }

    // Get redirect URL
    const redirectUrl = await snaptradeService.getRedirectUri(
      user.snaptrade_user_id!,
      user.snaptrade_user_secret!
    );

    return NextResponse.json({
      redirectUrl,
      message: 'Complete the connection in the popup window',
    });
  } catch (error) {
    console.error('Error getting redirect URL:', error);
    return NextResponse.json(
      {
        error: 'Failed to get connection URL',
        message: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
