/**
 * Leader Card - Futuristic cyberpunk design for leader profiles
 * Neon borders, glow effects, and premium visual hierarchy
 */

import { cn, formatPercent, formatNumber } from "@/lib/utils";
import { Badge, Shield, TrendingUp, Users, Star } from "lucide-react";

interface LeaderCardProps {
  leader: {
    id: string;
    full_name: string;
    bio?: string;
    is_verified: boolean;
    risk_level: 'low' | 'medium' | 'high';
    total_roi: number;
    win_rate: number;
    sharpe_ratio: number;
    active_followers: number;
    has_performance_badge?: boolean;
    trades_options?: boolean;
    avg_rating?: number;
  };
  rank?: number;
  onFollow?: () => void;
  className?: string;
}

export function LeaderCard({ leader, rank, onFollow, className }: LeaderCardProps) {
  const riskColors = {
    low: 'bg-[#00FF8820] text-[#00FF88] border-[#00FF8840]',
    medium: 'bg-[#FFD70020] text-[#FFD700] border-[#FFD70040]',
    high: 'bg-[#FF336620] text-[#FF3366] border-[#FF336640]',
  };

  return (
    <div className={cn(
      "group relative",
      "bg-black border-2 border-[#00FFF030]",
      "rounded-3xl p-8",
      "hover:border-[#00FFF0] hover:shadow-[0_0_40px_rgba(0,255,240,0.3)]",
      "transition-all duration-300",
      "cursor-pointer",
      className
    )}>
      {/* Rank badge (if provided) */}
      {rank && (
        <div className="absolute -top-4 -left-4 w-14 h-14 rounded-2xl bg-gradient-to-br from-[#00FFF0] to-[#7C3AED] flex items-center justify-center text-black font-black text-lg shadow-[0_0_30px_rgba(0,255,240,0.6)] z-10">
          #{rank}
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-2xl font-black text-white uppercase tracking-tight">
              {leader.full_name}
            </h3>
            {leader.is_verified && (
              <div className="p-1.5 rounded-full bg-[#00FFF020] border border-[#00FFF040]">
                <Badge className="w-5 h-5 text-[#00FFF0]" />
              </div>
            )}
            {leader.has_performance_badge && (
              <Star className="w-5 h-5 text-[#FFD700] fill-[#FFD700]" />
            )}
          </div>
          {leader.bio && (
            <p className="text-sm text-gray-400 line-clamp-2 leading-relaxed">
              {leader.bio}
            </p>
          )}
        </div>

        {/* Risk badge */}
        <div className={cn(
          "px-4 py-2 rounded-full text-xs font-black border-2 uppercase tracking-widest",
          riskColors[leader.risk_level]
        )}>
          {leader.risk_level}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="text-center">
          <div className="text-3xl font-black text-[#00FFF0] mb-2 tracking-tight">
            {leader.total_roi > 0 ? '+' : ''}{formatPercent(leader.total_roi)}
          </div>
          <div className="text-xs text-gray-500 uppercase tracking-widest font-bold">ROI</div>
        </div>
        <div className="text-center border-x-2 border-[#00FFF020]">
          <div className="text-3xl font-black text-white mb-2 tracking-tight">
            {formatPercent(leader.win_rate)}
          </div>
          <div className="text-xs text-gray-500 uppercase tracking-widest font-bold">Win Rate</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-black text-white mb-2 tracking-tight">
            {leader.sharpe_ratio.toFixed(2)}
          </div>
          <div className="text-xs text-gray-500 uppercase tracking-widest font-bold">Sharpe</div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-6 border-t-2 border-[#00FFF020]">
        <div className="flex items-center gap-2 text-sm text-gray-400 font-semibold">
          <Users className="w-5 h-5 text-[#7C3AED]" />
          <span>{formatNumber(leader.active_followers)} FOLLOWERS</span>
        </div>

        {onFollow && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onFollow();
            }}
            className="px-8 py-3 rounded-xl bg-gradient-to-r from-[#00FFF0] to-[#7C3AED] text-black font-black uppercase tracking-wider hover:shadow-[0_0_40px_rgba(0,255,240,0.6)] transition-all duration-300 hover:scale-105 text-sm"
          >
            Follow
          </button>
        )}
      </div>

      {/* Hover glow effect */}
      <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-gradient-to-br from-[#00FFF008] to-transparent" />
    </div>
  );
}
