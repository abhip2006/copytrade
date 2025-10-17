/**
 * Leader Stats Component - Displays detailed leader statistics
 * Implements missing P1 component from implementation status
 */

"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  Users,
  Activity,
  Award,
  DollarSign,
  Calendar,
  BarChart3,
  Target,
} from "lucide-react";
import { formatCurrency, formatPercent, formatNumber } from "@/lib/utils";

interface LeaderStatsData {
  total_roi: number;
  win_rate: number;
  sharpe_ratio: number;
  max_drawdown: number;
  total_trades: number;
  avg_trade_duration: number;
  active_followers: number;
  total_followers: number;
  avg_position_size: number;
  total_volume: number;
  consistency_score: number;
  experience_months: number;
}

interface LeaderStatsProps {
  stats: LeaderStatsData;
  riskLevel: 'low' | 'medium' | 'high';
}

export function LeaderStats({ stats, riskLevel }: LeaderStatsProps) {
  const getRiskBadgeVariant = (level: string) => {
    switch (level) {
      case 'low':
        return 'success';
      case 'medium':
        return 'warning';
      case 'high':
        return 'danger';
      default:
        return 'secondary';
    }
  };

  const getConsistencyBadge = (score: number) => {
    if (score >= 80) return { variant: 'success' as const, label: 'Excellent' };
    if (score >= 60) return { variant: 'primary' as const, label: 'Good' };
    if (score >= 40) return { variant: 'warning' as const, label: 'Fair' };
    return { variant: 'danger' as const, label: 'Poor' };
  };

  const consistencyBadge = getConsistencyBadge(stats.consistency_score);

  return (
    <div className="space-y-6">
      {/* Performance Stats */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-[var(--foreground)] mb-6 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-[var(--primary)]" />
          Performance Metrics
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-[var(--surface-elevated)]">
            <div className="text-xs text-[var(--foreground-muted)] mb-1">Total ROI</div>
            <div className={`text-xl font-bold ${
              stats.total_roi >= 0 ? 'text-[var(--success)]' : 'text-[var(--danger)]'
            }`}>
              {stats.total_roi >= 0 ? '+' : ''}{formatPercent(stats.total_roi)}
            </div>
          </div>
          <div className="p-4 rounded-lg bg-[var(--surface-elevated)]">
            <div className="text-xs text-[var(--foreground-muted)] mb-1">Win Rate</div>
            <div className="text-xl font-bold text-[var(--foreground)]">
              {formatPercent(stats.win_rate)}
            </div>
          </div>
          <div className="p-4 rounded-lg bg-[var(--surface-elevated)]">
            <div className="text-xs text-[var(--foreground-muted)] mb-1">Sharpe Ratio</div>
            <div className="text-xl font-bold text-[var(--foreground)]">
              {stats.sharpe_ratio.toFixed(2)}
            </div>
          </div>
          <div className="p-4 rounded-lg bg-[var(--surface-elevated)]">
            <div className="text-xs text-[var(--foreground-muted)] mb-1">Max Drawdown</div>
            <div className="text-xl font-bold text-[var(--danger)]">
              {formatPercent(stats.max_drawdown)}
            </div>
          </div>
        </div>
      </Card>

      {/* Trading Activity */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-[var(--foreground)] mb-6 flex items-center gap-2">
          <Activity className="w-5 h-5 text-[var(--primary)]" />
          Trading Activity
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-[var(--foreground-muted)]">Total Trades</span>
            <span className="text-sm font-semibold text-[var(--foreground)]">
              {formatNumber(stats.total_trades)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-[var(--foreground-muted)]">Total Volume</span>
            <span className="text-sm font-semibold text-[var(--foreground)]">
              {formatCurrency(stats.total_volume)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-[var(--foreground-muted)]">Avg Position Size</span>
            <span className="text-sm font-semibold text-[var(--foreground)]">
              {formatCurrency(stats.avg_position_size)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-[var(--foreground-muted)]">Avg Trade Duration</span>
            <span className="text-sm font-semibold text-[var(--foreground)]">
              {stats.avg_trade_duration} days
            </span>
          </div>
        </div>
      </Card>

      {/* Followers & Risk */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-[var(--foreground)] mb-6 flex items-center gap-2">
          <Users className="w-5 h-5 text-[var(--primary)]" />
          Community & Risk
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-[var(--foreground-muted)]">Active Followers</span>
            <span className="text-sm font-semibold text-[var(--success)]">
              {formatNumber(stats.active_followers)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-[var(--foreground-muted)]">Total Followers</span>
            <span className="text-sm font-semibold text-[var(--foreground)]">
              {formatNumber(stats.total_followers)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-[var(--foreground-muted)]">Risk Level</span>
            <Badge variant={getRiskBadgeVariant(riskLevel)}>
              {riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1)} Risk
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-[var(--foreground-muted)]">Consistency Score</span>
            <Badge variant={consistencyBadge.variant}>
              {consistencyBadge.label} ({stats.consistency_score}/100)
            </Badge>
          </div>
        </div>
      </Card>

      {/* Experience */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-[var(--foreground)] mb-6 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-[var(--primary)]" />
          Experience
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-[var(--foreground-muted)]">Trading Experience</span>
            <span className="text-sm font-semibold text-[var(--foreground)]">
              {Math.floor(stats.experience_months / 12)} years {stats.experience_months % 12} months
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-[var(--foreground-muted)]">Trades per Month</span>
            <span className="text-sm font-semibold text-[var(--foreground)]">
              {Math.round(stats.total_trades / stats.experience_months)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-[var(--foreground-muted)]">Win/Loss Ratio</span>
            <span className="text-sm font-semibold text-[var(--foreground)]">
              {(stats.win_rate / (100 - stats.win_rate)).toFixed(2)}:1
            </span>
          </div>
        </div>
      </Card>

      {/* Key Strengths */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-[var(--foreground)] mb-6 flex items-center gap-2">
          <Award className="w-5 h-5 text-[var(--primary)]" />
          Key Strengths
        </h3>
        <div className="space-y-3">
          {stats.win_rate >= 65 && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--success-bg)]">
              <Target className="w-5 h-5 text-[var(--success)]" />
              <span className="text-sm text-[var(--foreground)]">High Win Rate ({formatPercent(stats.win_rate)})</span>
            </div>
          )}
          {stats.sharpe_ratio >= 1.5 && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--success-bg)]">
              <BarChart3 className="w-5 h-5 text-[var(--success)]" />
              <span className="text-sm text-[var(--foreground)]">Excellent Risk-Adjusted Returns</span>
            </div>
          )}
          {stats.active_followers >= 100 && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--success-bg)]">
              <Users className="w-5 h-5 text-[var(--success)]" />
              <span className="text-sm text-[var(--foreground)]">Large Active Following</span>
            </div>
          )}
          {stats.consistency_score >= 70 && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--success-bg)]">
              <Award className="w-5 h-5 text-[var(--success)]" />
              <span className="text-sm text-[var(--foreground)]">Consistent Performance</span>
            </div>
          )}
          {stats.total_roi >= 50 && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--success-bg)]">
              <TrendingUp className="w-5 h-5 text-[var(--success)]" />
              <span className="text-sm text-[var(--foreground)]">Strong Total Returns</span>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
