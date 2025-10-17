/**
 * Leaders Discovery Page - Browse and filter verified traders
 * Advanced filtering with unique card grid layout
 */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LeaderCard } from "@/components/ui/leader-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { CopySettingsModal } from "@/components/copy/copy-settings-modal";
import { HeroHeader } from "@/components/blocks/hero-section-1";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Search,
  TrendingUp,
  Filter,
  SlidersHorizontal,
  ArrowUpDown,
  Users,
  Trophy,
  Target,
  TrendingDown,
} from "lucide-react";

// Mock data - will be replaced with API call
const MOCK_LEADERS = [
  {
    id: "1",
    full_name: "Sarah Chen",
    bio: "10+ years in tech stocks & options. Focus on high-growth companies with strong fundamentals.",
    is_verified: true,
    risk_level: "medium" as const,
    total_roi: 127.5,
    win_rate: 68.2,
    sharpe_ratio: 2.14,
    active_followers: 1247,
    has_performance_badge: true,
  },
  {
    id: "2",
    full_name: "Michael Rodriguez",
    bio: "Former hedge fund manager specializing in value investing and dividend growth stocks.",
    is_verified: true,
    risk_level: "low" as const,
    total_roi: 89.3,
    win_rate: 74.5,
    sharpe_ratio: 2.89,
    active_followers: 2103,
    has_performance_badge: true,
  },
  {
    id: "3",
    full_name: "Alex Thompson",
    bio: "Momentum trader focused on breakout patterns and technical analysis in growth stocks.",
    is_verified: true,
    risk_level: "high" as const,
    total_roi: 156.8,
    win_rate: 61.3,
    sharpe_ratio: 1.87,
    active_followers: 892,
    has_performance_badge: true,
  },
  {
    id: "4",
    full_name: "Emily Watson",
    bio: "Dividend income specialist. Conservative approach with focus on stable, established companies.",
    is_verified: true,
    risk_level: "low" as const,
    total_roi: 45.2,
    win_rate: 82.1,
    sharpe_ratio: 3.21,
    active_followers: 3452,
    has_performance_badge: true,
  },
  {
    id: "5",
    full_name: "David Kim",
    bio: "Quantitative trader using algorithmic strategies. Data-driven approach to market opportunities.",
    is_verified: true,
    risk_level: "medium" as const,
    total_roi: 98.7,
    win_rate: 65.4,
    sharpe_ratio: 2.45,
    active_followers: 1876,
    has_performance_badge: false,
  },
  {
    id: "6",
    full_name: "Jessica Martinez",
    bio: "Options specialist focusing on income generation through covered calls and cash-secured puts.",
    is_verified: true,
    risk_level: "medium" as const,
    total_roi: 76.3,
    win_rate: 71.8,
    sharpe_ratio: 2.67,
    active_followers: 1234,
    has_performance_badge: true,
    trades_options: true,
  },
];

type SortOption = "roi" | "win_rate" | "sharpe" | "followers";
type RiskFilter = "all" | "low" | "medium" | "high";

export default function LeadersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("roi");
  const [riskFilter, setRiskFilter] = useState<RiskFilter>("all");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [selectedLeader, setSelectedLeader] = useState<{ id: string; name: string } | null>(null);
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);

  // Keyboard shortcut for command palette (Cmd+K or Ctrl+K)
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCommandOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Filter and sort leaders
  const filteredLeaders = MOCK_LEADERS.filter((leader) => {
    const matchesSearch =
      leader.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      leader.bio?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRisk =
      riskFilter === "all" || leader.risk_level === riskFilter;
    const matchesVerified = !verifiedOnly || leader.is_verified;

    return matchesSearch && matchesRisk && matchesVerified;
  }).sort((a, b) => {
    switch (sortBy) {
      case "roi":
        return b.total_roi - a.total_roi;
      case "win_rate":
        return b.win_rate - a.win_rate;
      case "sharpe":
        return b.sharpe_ratio - a.sharpe_ratio;
      case "followers":
        return b.active_followers - a.active_followers;
      default:
        return 0;
    }
  });

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <HeroHeader />

      <div className="container mx-auto px-6 py-12 pt-24">
        {/* Page Header */}
        <div className="mb-12">
          <h1 className="text-5xl font-bold mb-4">
            <span className="text-[var(--foreground)]">Discover </span>
            <span className="gradient-text">Top Leaders</span>
          </h1>
          <p className="text-lg text-[var(--foreground-muted)] max-w-2xl">
            Browse verified traders with proven track records. Filter by risk level, performance metrics, and trading style to find leaders that match your goals.
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          {/* Search Bar */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <button
                onClick={() => setCommandOpen(true)}
                className="w-full h-12 px-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground-muted)] text-sm text-left flex items-center justify-between hover:border-[var(--primary)] transition-all group"
              >
                <div className="flex items-center gap-3">
                  <Search className="w-5 h-5 text-[var(--foreground-subtle)]" />
                  <span>Search leaders by name, strategy, or performance...</span>
                </div>
                <kbd className="hidden sm:inline-flex h-6 select-none items-center gap-1 rounded bg-[var(--surface-elevated)] px-2 font-mono text-xs font-semibold text-[var(--foreground-muted)] group-hover:bg-[var(--primary)] group-hover:text-white transition-colors">
                  <span className="text-xs">⌘</span>K
                </kbd>
              </button>
            </div>

            {/* Sort Dropdown */}
            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="h-12 px-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition-all"
              >
                <option value="roi">Highest ROI</option>
                <option value="win_rate">Win Rate</option>
                <option value="sharpe">Sharpe Ratio</option>
                <option value="followers">Most Followers</option>
              </select>

              <Button variant="outline" size="icon">
                <SlidersHorizontal className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Filter Badges */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setRiskFilter("all")}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                riskFilter === "all"
                  ? "bg-[var(--primary)] text-white"
                  : "bg-[var(--surface-elevated)] text-[var(--foreground-muted)] hover:bg-[var(--surface-hover)]"
              }`}
            >
              All Risk Levels
            </button>
            <button
              onClick={() => setRiskFilter("low")}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                riskFilter === "low"
                  ? "bg-[var(--success)] text-white"
                  : "bg-[var(--success-bg)] text-[var(--success)] hover:opacity-80"
              }`}
            >
              Low Risk
            </button>
            <button
              onClick={() => setRiskFilter("medium")}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                riskFilter === "medium"
                  ? "bg-[var(--warning)] text-white"
                  : "bg-[var(--warning-bg)] text-[var(--warning)] hover:opacity-80"
              }`}
            >
              Medium Risk
            </button>
            <button
              onClick={() => setRiskFilter("high")}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                riskFilter === "high"
                  ? "bg-[var(--danger)] text-white"
                  : "bg-[var(--danger-bg)] text-[var(--danger)] hover:opacity-80"
              }`}
            >
              High Risk
            </button>

            <div className="ml-auto flex items-center gap-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={verifiedOnly}
                  onChange={(e) => setVerifiedOnly(e.target.checked)}
                  className="w-4 h-4 rounded border-[var(--border)] bg-[var(--surface)] text-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]"
                />
                <span className="text-sm text-[var(--foreground-muted)]">
                  Verified only
                </span>
              </label>
            </div>
          </div>

          {/* Results Count */}
          <div className="flex items-center gap-2 text-sm text-[var(--foreground-muted)]">
            <Users className="w-4 h-4" />
            <span>
              Showing {filteredLeaders.length} leader
              {filteredLeaders.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        {/* Leaders Grid */}
        {filteredLeaders.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLeaders.map((leader, index) => (
              <div key={leader.id}>
                <LeaderCard
                  leader={leader}
                  rank={index + 1}
                  onFollow={() => {
                    setSelectedLeader({ id: leader.id, name: leader.full_name });
                    setShowCopyModal(true);
                  }}
                />
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Search}
            title="No leaders found"
            description="Try adjusting your search criteria or filters to see more results."
            action={{
              label: "Clear Filters",
              onClick: () => {
                setSearchQuery("");
                setRiskFilter("all");
                setVerifiedOnly(false);
              },
            }}
          />
        )}
      </div>

      {/* Copy Settings Modal */}
      {selectedLeader && (
        <CopySettingsModal
          leaderId={selectedLeader.id}
          leaderName={selectedLeader.name}
          isOpen={showCopyModal}
          onClose={() => {
            setShowCopyModal(false);
            setSelectedLeader(null);
          }}
          onSuccess={() => {
            console.log("Successfully started copying", selectedLeader.name);
            // Could show a success toast here
          }}
        />
      )}

      {/* Command Palette for Quick Search */}
      <CommandDialog open={commandOpen} onOpenChange={setCommandOpen}>
        <CommandInput placeholder="Search leaders by name, strategy, or performance..." />
        <CommandList>
          <CommandEmpty>No leaders found.</CommandEmpty>

          {/* Top Performers */}
          <CommandGroup heading="Top Performers">
            {MOCK_LEADERS.filter(l => l.has_performance_badge)
              .slice(0, 3)
              .map((leader) => (
                <CommandItem
                  key={leader.id}
                  onSelect={() => {
                    setCommandOpen(false);
                    setSelectedLeader({ id: leader.id, name: leader.full_name });
                    setShowCopyModal(true);
                  }}
                  className="cursor-pointer"
                >
                  <Trophy className="mr-3 h-5 w-5 text-yellow-500" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{leader.full_name}</span>
                      {leader.is_verified && (
                        <Badge variant="success" className="text-xs">Verified</Badge>
                      )}
                    </div>
                    <p className="text-xs text-[var(--foreground-muted)] mt-1">
                      {leader.total_roi.toFixed(1)}% ROI • {leader.win_rate.toFixed(1)}% Win Rate
                    </p>
                  </div>
                </CommandItem>
              ))}
          </CommandGroup>

          {/* By Risk Level */}
          <CommandGroup heading="Low Risk Leaders">
            {MOCK_LEADERS.filter(l => l.risk_level === "low")
              .slice(0, 2)
              .map((leader) => (
                <CommandItem
                  key={leader.id}
                  onSelect={() => {
                    setCommandOpen(false);
                    setSelectedLeader({ id: leader.id, name: leader.full_name });
                    setShowCopyModal(true);
                  }}
                  className="cursor-pointer"
                >
                  <Target className="mr-3 h-5 w-5 text-green-500" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{leader.full_name}</span>
                      <Badge variant="success" className="text-xs">Low Risk</Badge>
                    </div>
                    <p className="text-xs text-[var(--foreground-muted)] mt-1">
                      {leader.bio}
                    </p>
                  </div>
                </CommandItem>
              ))}
          </CommandGroup>

          {/* High Growth */}
          <CommandGroup heading="High Growth Leaders">
            {MOCK_LEADERS.filter(l => l.risk_level === "high")
              .slice(0, 2)
              .map((leader) => (
                <CommandItem
                  key={leader.id}
                  onSelect={() => {
                    setCommandOpen(false);
                    setSelectedLeader({ id: leader.id, name: leader.full_name });
                    setShowCopyModal(true);
                  }}
                  className="cursor-pointer"
                >
                  <TrendingUp className="mr-3 h-5 w-5 text-blue-500" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{leader.full_name}</span>
                      <Badge variant="danger" className="text-xs">High Risk</Badge>
                    </div>
                    <p className="text-xs text-[var(--foreground-muted)] mt-1">
                      {leader.total_roi.toFixed(1)}% ROI • {leader.active_followers} followers
                    </p>
                  </div>
                </CommandItem>
              ))}
          </CommandGroup>

          {/* All Leaders */}
          <CommandGroup heading="All Leaders">
            {MOCK_LEADERS.map((leader) => (
              <CommandItem
                key={leader.id}
                onSelect={() => {
                  setCommandOpen(false);
                  setSelectedLeader({ id: leader.id, name: leader.full_name });
                  setShowCopyModal(true);
                }}
                className="cursor-pointer"
              >
                <Users className="mr-3 h-5 w-5 text-[var(--foreground-muted)]" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{leader.full_name}</span>
                  </div>
                  <p className="text-xs text-[var(--foreground-muted)] mt-1 line-clamp-1">
                    {leader.bio}
                  </p>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </div>
  );
}
