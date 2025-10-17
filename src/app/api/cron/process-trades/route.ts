/**
 * Cron Job: Process Trades
 * Called by Vercel Cron every 30 seconds
 * Processes pending copy trades
 */

import { NextRequest, NextResponse } from 'next/server';
import { copyTradeEngine } from '@/lib/trading/copy-engine';

export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * GET /api/cron/process-trades
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

    console.log('[CRON] Starting trade processing...');

    // Process all pending trades
    const stats = await copyTradeEngine.processAllPendingTrades();

    console.log('[CRON] Trade processing completed:', stats);

    return NextResponse.json({
      success: true,
      stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[CRON] Error processing trades:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process trades',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
