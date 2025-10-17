/**
 * API Route: Portfolio Data
 * Get user's portfolio information (positions and balances)
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { snaptradeService } from '@/lib/snaptrade/client';

export const runtime = 'nodejs';

/**
 * GET /api/portfolio
 * Get user's portfolio data from SnapTrade
 */
export async function GET(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = createServiceRoleClient();

    // Get user
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

    // Get user's accounts
    const accounts = await snaptradeService.listUserAccounts(
      user.snaptrade_user_id,
      user.snaptrade_user_secret
    );

    if (!accounts || accounts.length === 0) {
      return NextResponse.json({
        accounts: [],
        totalValue: 0,
        positions: [],
        balances: [],
      });
    }

    // Get data for each account
    const portfolioData = await Promise.all(
      accounts.map(async (account: any) => {
        try {
          const [balances, positions] = await Promise.all([
            snaptradeService.getAccountBalances(
              user.snaptrade_user_id!,
              user.snaptrade_user_secret!,
              account.id
            ),
            snaptradeService.getAccountPositions(
              user.snaptrade_user_id!,
              user.snaptrade_user_secret!,
              account.id
            ),
          ]);

          return {
            account,
            balances,
            positions,
          };
        } catch (error) {
          console.error(`Error fetching data for account ${account.id}:`, error);
          return {
            account,
            balances: [],
            positions: [],
          };
        }
      })
    );

    // Calculate total portfolio value
    const totalValue = portfolioData.reduce((sum, data) => {
      const accountValue = data.account.balance?.total?.amount || 0;
      return sum + accountValue;
    }, 0);

    // Aggregate all positions
    const allPositions = portfolioData.flatMap((data) => data.positions);
    const allBalances = portfolioData.flatMap((data) => data.balances);

    return NextResponse.json({
      accounts: portfolioData.map((d) => d.account),
      totalValue,
      positions: allPositions,
      balances: allBalances,
    });
  } catch (error) {
    console.error('Error in GET /api/portfolio:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch portfolio',
        message: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
