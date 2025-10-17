/**
 * API Route: Detect Trades
 * Endpoint to manually trigger trade detection
 * Called by cron job or manually for testing
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { tradeDetector } from '@/lib/trading/trade-detection';

export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * POST /api/trades/detect
 * Poll all leaders and detect new trades
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const { userId } = await auth();

    // Check for cron secret
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    const isAdmin = userId; // TODO: Check if user is admin
    const isCronJob = cronSecret && authHeader === `Bearer ${cronSecret}`;

    if (!isAdmin && !isCronJob) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Detect trades
    const result = await tradeDetector.pollAllLeaders();

    return NextResponse.json({
      success: true,
      result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error detecting trades:', error);
    return NextResponse.json(
      {
        error: 'Failed to detect trades',
        message: (error as Error).message,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/trades/detect
 * Get detection endpoint info
 */
export async function GET() {
  return NextResponse.json({
    message: 'Trade detection endpoint',
    method: 'POST',
    description: 'Polls leader accounts and detects new trades',
  });
}
