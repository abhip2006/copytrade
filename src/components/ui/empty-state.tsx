/**
 * Empty State Component - Elegant empty states with illustrations
 * For empty lists, no data, etc.
 */

import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { Button } from "./button";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-12 text-center",
        "rounded-2xl border-2 border-dashed border-[var(--border)]",
        "bg-[var(--surface)]",
        className
      )}
    >
      {Icon && (
        <div className="mb-6 relative">
          {/* Glow effect behind icon */}
          <div className="absolute inset-0 blur-3xl opacity-30 bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)]" />
          <div className="relative p-6 rounded-3xl bg-[var(--surface-elevated)] border border-[var(--border)]">
            <Icon className="w-12 h-12 text-[var(--primary)]" strokeWidth={1.5} />
          </div>
        </div>
      )}

      <h3 className="text-xl font-bold text-[var(--foreground)] mb-2">
        {title}
      </h3>

      {description && (
        <p className="text-sm text-[var(--foreground-muted)] max-w-md mb-6">
          {description}
        </p>
      )}

      {action && (
        <Button onClick={action.onClick} variant="default">
          {action.label}
        </Button>
      )}
    </div>
  );
}
