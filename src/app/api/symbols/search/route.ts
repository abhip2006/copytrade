/**
 * Symbol Search API - Search for trading symbols via SnapTrade
 * GET /api/symbols/search?query=AAPL
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('query');

    if (!query) {
      return NextResponse.json(
        { error: 'query parameter is required' },
        { status: 400 }
      );
    }

    // Get user's SnapTrade credentials from database
    const supabase = await createClient();
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('snaptrade_user_id, snaptrade_user_secret')
      .eq('clerk_user_id', userId)
      .single();

    if (userError || !user?.snaptrade_user_id || !user?.snaptrade_user_secret) {
      return NextResponse.json(
        { error: 'SnapTrade account not connected' },
        { status: 400 }
      );
    }

    // Search symbols via SnapTrade
    const response = await fetch(
      `https://api.snaptrade.com/api/v1/symbols?userId=${user.snaptrade_user_id}&userSecret=${user.snaptrade_user_secret}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ConsumerKey': process.env.SNAPTRADE_CONSUMER_KEY!,
        },
        body: JSON.stringify({ substring: query }),
      }
    );

    if (!response.ok) {
      throw new Error('SnapTrade API error');
    }

    const symbols = await response.json();

    // Format response
    const formattedSymbols = symbols.map((item: any) => ({
      id: item.symbol.id,
      symbol: item.symbol.symbol,
      description: item.symbol.description,
      type: item.symbol.type?.description || 'Unknown',
      exchange: item.symbol.exchange?.name || '',
    }));

    return NextResponse.json({
      success: true,
      data: formattedSymbols,
    });
  } catch (error) {
    console.error('Symbol search error:', error);
    return NextResponse.json(
      { error: 'Failed to search symbols' },
      { status: 500 }
    );
  }
}
