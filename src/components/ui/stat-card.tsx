/**
 * Stat Card Component - Futuristic cyberpunk design
 * Neon glow effects and premium visual hierarchy
 */

import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  change?: {
    value: number;
    period: string;
  };
  icon?: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  className?: string;
}

export function StatCard({
  label,
  value,
  change,
  icon: Icon,
  trend = 'neutral',
  className
}: StatCardProps) {
  return (
    <div className={cn(
      "group relative overflow-hidden",
      "bg-black border-2 border-[#00FFF030]",
      "rounded-3xl p-8",
      "hover:border-[#00FFF0] hover:shadow-[0_0_40px_rgba(0,255,240,0.3)]",
      "transition-all duration-300",
      className
    )}>
      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#00FFF008] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <span className="text-sm font-black text-gray-400 uppercase tracking-widest">
            {label}
          </span>
          {Icon && (
            <div className="p-3 rounded-2xl bg-gradient-to-br from-[#00FFF020] to-[#7C3AED20] border-2 border-[#00FFF030] group-hover:border-[#00FFF0] group-hover:shadow-[0_0_20px_rgba(0,255,240,0.4)] transition-all">
              <Icon className="w-6 h-6 text-[#00FFF0]" />
            </div>
          )}
        </div>

        {/* Value */}
        <div className="mb-4">
          <span className="text-5xl font-black text-white tracking-tight">
            {value}
          </span>
        </div>

        {/* Change indicator */}
        {change && (
          <div className="flex items-center gap-3">
            <div className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest border-2",
              trend === 'up' && "bg-[#00FF8820] text-[#00FF88] border-[#00FF8840]",
              trend === 'down' && "bg-[#FF336620] text-[#FF3366] border-[#FF336640]",
              trend === 'neutral' && "bg-[#7C3AED20] text-[#A78BFA] border-[#7C3AED40]"
            )}>
              {trend === 'up' && '↑'}
              {trend === 'down' && '↓'}
              {trend === 'neutral' && '→'}
              <span>{Math.abs(change.value)}%</span>
            </div>
            <span className="text-xs text-gray-500 font-bold uppercase tracking-wide">
              {change.period}
            </span>
          </div>
        )}
      </div>

      {/* Animated border gradient on hover */}
      <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-gradient-to-r from-[#00FFF005] via-[#7C3AED05] to-[#FF00FF05]" />
    </div>
  );
}
