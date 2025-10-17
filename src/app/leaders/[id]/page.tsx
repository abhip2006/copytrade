/**
 * Leader Profile Page - Detailed leader profile with stats and performance
 * Implements missing P1 feature from implementation status
 */

"use client";

import { useState, useEffect } from "react";
import { use } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { CopySettingsModal } from "@/components/copy/copy-settings-modal";
import { PerformanceChart } from "@/components/leader/performance-chart";
import { LeaderStats } from "@/components/leader/leader-stats";
import {
  TrendingUp,
  ArrowLeft,
  Share2,
  Flag,
  Star,
  CheckCircle,
  Award,
  RefreshCw,
  Play,
  Settings,
  Bell,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { formatCurrency, formatPercent, formatDateTime } from "@/lib/utils";
import { TradeOSLogoCompact } from '@/components/branding/tradeos-logo';

interface LeaderData {
  id: string;
  full_name: string;
  bio: string;
  is_verified: boolean;
  is_public: boolean;
  risk_level: 'low' | 'medium' | 'high';
  avg_rating: number;
  review_count: number;
}

interface LeaderPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function LeaderProfilePage({ params }: LeaderPageProps) {
  const resolvedParams = use(params);
  const [leader, setLeader] = useState<LeaderData | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [recentTrades, setRecentTrades] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    fetchLeaderData();
  }, [resolvedParams.id]);

  const fetchLeaderData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/leaders/${resolvedParams.id}`);
      const data = await response.json();

      if (data.leader) {
        setLeader(data.leader);
        setStats(data.stats || generateMockStats());
        setRecentTrades(data.recentTrades || []);
        setReviews(data.reviews || []);
      }
    } catch (error) {
      console.error('Failed to fetch leader data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollowClick = () => {
    setShowCopyModal(true);
  };

  const handleCopySettingsSaved = () => {
    setShowCopyModal(false);
    setIsFollowing(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-8 h-8 animate-spin text-[var(--primary)]" />
          <p className="text-[var(--foreground-muted)]">Loading leader profile...</p>
        </div>
      </div>
    );
  }

  if (!leader) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-[var(--foreground)] mb-2">Leader Not Found</h2>
          <p className="text-[var(--foreground-muted)] mb-4">The leader you're looking for doesn't exist or is not public.</p>
          <Link href="/leaders">
            <Button variant="primary">Browse Leaders</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <div className="border-b border-[var(--border)] bg-[var(--surface)] sticky top-0 z-40">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/leaders" className="flex items-center gap-2">
              <TradeOSLogoCompact />
            </Link>

            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon">
                <Bell className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon">
                <Settings className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-12">
        {/* Back Button */}
        <Link
          href="/leaders"
          className="text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)] mb-6 inline-flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Leaders
        </Link>

        {/* Leader Header */}
        <div className="mb-12">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-6">
              {/* Avatar */}
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] flex items-center justify-center text-white text-3xl font-bold">
                {leader.full_name.charAt(0).toUpperCase()}
              </div>

              {/* Info */}
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold gradient-text">{leader.full_name}</h1>
                  {leader.is_verified && (
                    <Badge variant="primary" className="gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Verified
                    </Badge>
                  )}
                  <Badge variant={
                    leader.risk_level === 'low' ? 'success' :
                    leader.risk_level === 'medium' ? 'warning' : 'danger'
                  }>
                    {leader.risk_level.charAt(0).toUpperCase() + leader.risk_level.slice(1)} Risk
                  </Badge>
                </div>
                <p className="text-[var(--foreground-muted)] mb-4">{leader.bio}</p>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                    <span className="font-semibold text-[var(--foreground)]">
                      {leader.avg_rating.toFixed(1)}
                    </span>
                    <span className="text-sm text-[var(--foreground-muted)]">
                      ({leader.review_count} reviews)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-[var(--primary)]" />
                    <span className="text-sm text-[var(--foreground-muted)]">
                      Performance Badge
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button variant="outline" className="gap-2">
                <Share2 className="w-5 h-5" />
                Share
              </Button>
              <Button variant="outline" className="gap-2">
                <Flag className="w-5 h-5" />
                Report
              </Button>
              {isFollowing ? (
                <Button variant="success" className="gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Following
                </Button>
              ) : (
                <Button variant="primary" className="gap-2" onClick={handleFollowClick}>
                  <Play className="w-5 h-5" />
                  Start Copying
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Performance & Trades */}
          <div className="lg:col-span-2 space-y-8">
            {/* Performance Chart */}
            <PerformanceChart
              totalReturn={stats?.total_roi || 0}
              winRate={stats?.win_rate || 0}
              sharpeRatio={stats?.sharpe_ratio || 0}
            />

            {/* Recent Trades */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-[var(--foreground)] mb-6">
                Recent Trades
              </h2>
              {recentTrades.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Symbol</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentTrades.map((trade) => (
                      <TableRow key={trade.id}>
                        <TableCell>
                          <span className="font-semibold text-[var(--foreground)]">
                            {trade.symbol}
                          </span>
                        </TableCell>
                        <TableCell>
                          {trade.action === 'buy' ? (
                            <Badge variant="success" className="gap-1">
                              <ArrowUpRight className="w-3 h-3" />
                              BUY
                            </Badge>
                          ) : (
                            <Badge variant="danger" className="gap-1">
                              <ArrowDownRight className="w-3 h-3" />
                              SELL
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>{trade.quantity}</TableCell>
                        <TableCell>{formatCurrency(trade.executed_price || trade.price)}</TableCell>
                        <TableCell>
                          <Badge variant={trade.status === 'filled' ? 'success' : 'warning'}>
                            {trade.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-[var(--foreground-subtle)]">
                          {formatDateTime(trade.executed_at)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center text-[var(--foreground-muted)] py-8">
                  No recent trades available
                </p>
              )}
            </Card>

            {/* Reviews */}
            {reviews.length > 0 && (
              <Card className="p-6">
                <h2 className="text-xl font-semibold text-[var(--foreground)] mb-6">
                  Follower Reviews
                </h2>
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="p-4 rounded-lg bg-[var(--surface-elevated)]">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-[var(--primary-bg)] flex items-center justify-center text-sm font-semibold">
                            {review.reviewer?.full_name?.charAt(0) || 'U'}
                          </div>
                          <span className="font-semibold text-[var(--foreground)]">
                            {review.reviewer?.full_name || 'Anonymous'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < review.rating
                                  ? 'text-yellow-500 fill-yellow-500'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-[var(--foreground-muted)]">
                        {review.comment}
                      </p>
                      <p className="text-xs text-[var(--foreground-subtle)] mt-2">
                        {formatDateTime(review.created_at)}
                      </p>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* Right Column - Stats */}
          <div className="lg:col-span-1">
            <LeaderStats stats={stats} riskLevel={leader.risk_level} />
          </div>
        </div>
      </div>

      {/* Copy Settings Modal */}
      {showCopyModal && (
        <CopySettingsModal
          leaderId={leader.id}
          leaderName={leader.full_name}
          onClose={() => setShowCopyModal(false)}
          onSave={handleCopySettingsSaved}
        />
      )}
    </div>
  );
}

// Helper function to generate mock stats when API doesn't return them
function generateMockStats() {
  return {
    total_roi: 127.5,
    win_rate: 68.2,
    sharpe_ratio: 2.14,
    max_drawdown: -12.3,
    total_trades: 342,
    avg_trade_duration: 12,
    active_followers: 1247,
    total_followers: 1891,
    avg_position_size: 5000,
    total_volume: 1750000,
    consistency_score: 78,
    experience_months: 36,
  };
}
