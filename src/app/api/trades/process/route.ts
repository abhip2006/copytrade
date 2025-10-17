/**
 * API Route: Process Pending Trades
 * Endpoint to manually trigger trade processing
 * Called by cron job or manually for testing
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { copyTradeEngine } from '@/lib/trading/copy-engine';

export const runtime = 'nodejs'; // Use Node.js runtime for long-running operations
export const maxDuration = 60; // Allow up to 60 seconds for processing

/**
 * POST /api/trades/process
 * Process all pending trades
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication (admin only or cron job)
    const { userId } = await auth();

    // For cron jobs, check for secret token
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

    // Process all pending trades
    const stats = await copyTradeEngine.processAllPendingTrades();

    return NextResponse.json({
      success: true,
      stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error processing trades:', error);
    return NextResponse.json(
      {
        error: 'Failed to process trades',
        message: (error as Error).message,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/trades/process
 * Get processing status
 */
export async function GET() {
  return NextResponse.json({
    message: 'Trade processing endpoint',
    method: 'POST',
    description: 'Processes all pending copy trades',
  });
}
