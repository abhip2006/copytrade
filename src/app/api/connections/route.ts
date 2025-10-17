/**
 * API Route: Brokerage Connections
 * List and sync brokerage connections
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { snaptradeService } from '@/lib/snaptrade/client';

export const runtime = 'nodejs';

/**
 * GET /api/connections
 * List user's brokerage connections
 */
export async function GET() {
  try {
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = createServiceRoleClient();

    // Get user from Supabase
    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('clerk_user_id', clerkUserId)
      .single();

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get connections from database
    const { data: connections, error } = await supabase
      .from('brokerage_connections')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching connections:', error);
      return NextResponse.json(
        { error: 'Failed to fetch connections' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      connections: connections || [],
    });
  } catch (error) {
    console.error('Error in GET /api/connections:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/connections
 * Sync connections from SnapTrade
 */
export async function POST(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = createServiceRoleClient();

    // Get user from Supabase
    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('clerk_user_id', clerkUserId)
      .single();

    if (!user || !user.snaptrade_user_id || !user.snaptrade_user_secret) {
      return NextResponse.json(
        { error: 'User not connected to SnapTrade' },
        { status: 400 }
      );
    }

    // Get connections from SnapTrade
    const snapTradeConnections = await snaptradeService.listBrokerageAuthorizations(
      user.snaptrade_user_id,
      user.snaptrade_user_secret
    );

    // Get accounts for each connection
    const accounts = await snaptradeService.listUserAccounts(
      user.snaptrade_user_id,
      user.snaptrade_user_secret
    );

    // Sync to database
    const connectionsToUpsert = accounts.map((account: any) => ({
      user_id: user.id,
      connection_id: account.brokerage_authorization || account.id,
      account_id: account.id,
      brokerage_name: account.institution_name || 'Unknown',
      account_number: account.number,
      account_type: account.raw_type,
      balance: account.balance?.total?.amount || 0,
      status: 'active' as const,
    }));

    // Upsert connections
    const { error } = await supabase
      .from('brokerage_connections')
      .upsert(connectionsToUpsert, {
        onConflict: 'user_id,account_id',
        ignoreDuplicates: false,
      });

    if (error) {
      console.error('Error syncing connections:', error);
      return NextResponse.json(
        { error: 'Failed to sync connections' },
        { status: 500 }
      );
    }

    // Get updated connections
    const { data: updatedConnections } = await supabase
      .from('brokerage_connections')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    return NextResponse.json({
      message: 'Connections synced successfully',
      connections: updatedConnections || [],
      synced: connectionsToUpsert.length,
    });
  } catch (error) {
    console.error('Error in POST /api/connections:', error);
    return NextResponse.json(
      {
        error: 'Failed to sync connections',
        message: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
