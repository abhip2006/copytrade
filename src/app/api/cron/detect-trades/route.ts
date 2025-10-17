/**
 * Cron Job: Detect Trades
 * Called by Vercel Cron every 30 seconds
 * Polls leader accounts for new trades
 */

import { NextRequest, NextResponse } from 'next/server';
import { tradeDetector } from '@/lib/trading/trade-detection';

export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * GET /api/cron/detect-trades
 * Vercel Cron calls this endpoint
 */
export async function GET(request: NextRequest) {
  try {
    // Verify request is from Vercel Cron
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'development';

    // In production, verify the cron secret
    if (process.env.NODE_ENV === 'production') {
      if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
        console.error('Unauthorized cron request');
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 401 }
        );
      }
    }

    console.log('[CRON] Starting trade detection...');

    // Detect trades
    const result = await tradeDetector.pollAllLeaders();

    console.log('[CRON] Trade detection completed:', result);

    return NextResponse.json({
      success: true,
      result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[CRON] Error detecting trades:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to detect trades',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
