/**
 * Features Page
 * Comprehensive showcase of TradeOS platform capabilities
 * Based on implemented functionality and product roadmap
 */

"use client";

import Link from "next/link";
import {
  TrendingUp,
  Users,
  Shield,
  Zap,
  LineChart,
  Lock,
  Copy,
  BarChart3,
  DollarSign,
  Target,
  Bell,
  Settings
} from "lucide-react";
import { BentoCard, BentoGrid } from "@/components/ui/bento-grid";
import { Button } from "@/components/ui/button";
import { AnimatedBackground } from "@/components/ui/animated-background";
import { HeroHeader } from "@/components/blocks/hero-section-1";

const features = [
  {
    Icon: Copy,
    name: "Automated Trade Copying",
    description: "Automatically replicate trades from verified professional traders in real-time. Set your allocation strategy and let the platform handle execution.",
    href: "/sign-up",
    cta: "Start Copying",
    background: (
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-transparent" />
    ),
    className: "lg:row-start-1 lg:row-end-4 lg:col-start-2 lg:col-end-3",
  },
  {
    Icon: Users,
    name: "Discover Top Traders",
    description: "Browse and follow verified trading professionals. Filter by performance metrics, risk level, trading style, and asset classes.",
    href: "/leaders",
    cta: "Browse Leaders",
    background: (
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-transparent" />
    ),
    className: "lg:col-start-1 lg:col-end-2 lg:row-start-1 lg:row-end-3",
  },
  {
    Icon: Shield,
    name: "Advanced Risk Management",
    description: "Set stop-loss, take-profit, and position sizing rules. Protect your capital with customizable risk controls and portfolio limits.",
    href: "/sign-up",
    cta: "Learn More",
    background: (
      <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 via-transparent to-transparent" />
    ),
    className: "lg:col-start-1 lg:col-end-2 lg:row-start-3 lg:row-end-4",
  },
  {
    Icon: LineChart,
    name: "Real-Time Analytics",
    description: "Track performance with detailed analytics dashboards. Monitor ROI, win rate, Sharpe ratio, and drawdown metrics in real-time.",
    href: "/sign-up",
    cta: "View Demo",
    background: (
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-transparent" />
    ),
    className: "lg:col-start-3 lg:col-end-3 lg:row-start-1 lg:row-end-2",
  },
  {
    Icon: Zap,
    name: "Lightning-Fast Execution",
    description: "Sub-second trade replication powered by SnapTrade API integration. Never miss an opportunity with our optimized execution engine.",
    href: "/sign-up",
    cta: "See Speed",
    background: (
      <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 via-transparent to-transparent" />
    ),
    className: "lg:col-start-3 lg:col-end-3 lg:row-start-2 lg:row-end-4",
  },
];

const additionalFeatures = [
  {
    icon: Lock,
    title: "Secure Brokerage Integration",
    description: "Connect your existing brokerage account securely through SnapTrade. We never store your credentials or have direct access to your funds.",
  },
  {
    icon: Target,
    title: "Flexible Allocation Strategies",
    description: "Choose between fixed amount, percentage of portfolio, or percentage of leader's position. Customize allocation per leader.",
  },
  {
    icon: BarChart3,
    title: "Performance Tracking",
    description: "Detailed trade history, P&L tracking, and performance attribution. Understand exactly which strategies are working.",
  },
  {
    icon: DollarSign,
    title: "Multi-Asset Support",
    description: "Copy trades across stocks, ETFs, options, and cryptocurrencies. Diversify across multiple asset classes automatically.",
  },
  {
    icon: Bell,
    title: "Smart Notifications",
    description: "Get alerted when leaders execute trades, hit performance milestones, or when your copy settings need attention.",
  },
  {
    icon: Settings,
    title: "Granular Controls",
    description: "Filter which asset classes to copy, set maximum position sizes, and configure risk parameters for each leader you follow.",
  },
];

export default function FeaturesPage() {
  return (
    <div className="min-h-screen relative">
      {/* Animated Background */}
      <AnimatedBackground />

      {/* Navigation */}
      <HeroHeader />

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-6">
        <div className="container mx-auto text-center max-w-4xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full mb-6">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">Professional Trading, Made Accessible</span>
          </div>

          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Everything You Need to Copy
            <br />
            <span className="text-blue-600">Professional Traders</span>
          </h1>

          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            TradeOS provides institutional-grade tools to democratize access to professional trading strategies.
            No experience required—just connect, configure, and copy.
          </p>

          <div className="flex items-center justify-center gap-4">
            <Link href="/sign-up">
              <Button size="lg" className="h-12 px-8">
                Start Copying Free
              </Button>
            </Link>
            <Link href="/leaders">
              <Button variant="outline" size="lg" className="h-12 px-8">
                View Top Traders
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Main Features - Bento Grid */}
      <section className="py-16 px-6">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Core Platform Features
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Built with cutting-edge technology to provide the best copy trading experience
            </p>
          </div>

          <BentoGrid className="lg:grid-rows-3">
            {features.map((feature) => (
              <BentoCard key={feature.name} {...feature} />
            ))}
          </BentoGrid>
        </div>
      </section>

      {/* Additional Features Grid */}
      <section className="py-16 px-6 bg-gray-50">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Powerful Tools for Every Investor
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Everything you need to manage your copy trading portfolio effectively
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {additionalFeatures.map((feature, idx) => (
              <div
                key={idx}
                className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-6">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              How TradeOS Works
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Get started in minutes with our streamlined onboarding process
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Sign Up</h3>
              <p className="text-sm text-gray-600">Create your free account in under 2 minutes</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Connect Brokerage</h3>
              <p className="text-sm text-gray-600">Securely link your existing brokerage account</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Choose Leaders</h3>
              <p className="text-sm text-gray-600">Browse and select professional traders to follow</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                4
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Start Copying</h3>
              <p className="text-sm text-gray-600">Trades are automatically replicated to your account</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-br from-blue-600 to-blue-800">
        <div className="container mx-auto text-center max-w-3xl">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Start Copy Trading?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of investors who are already copying professional traders.
            No subscription fees—you only pay standard brokerage commissions.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/sign-up">
              <Button size="lg" variant="secondary" className="h-12 px-8">
                Get Started Free
              </Button>
            </Link>
            <Link href="/leaders">
              <Button size="lg" variant="outline" className="h-12 px-8 bg-transparent text-white border-white hover:bg-white/10">
                View Top Traders
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-6">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-white font-bold text-lg mb-4">TradeOS</h3>
              <p className="text-sm">
                Democratizing access to professional trading strategies.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/features" className="hover:text-white">Features</Link></li>
                <li><Link href="/leaders" className="hover:text-white">Browse Leaders</Link></li>
                <li><Link href="/sign-up" className="hover:text-white">Pricing</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/" className="hover:text-white">About</Link></li>
                <li><Link href="/" className="hover:text-white">Blog</Link></li>
                <li><Link href="/" className="hover:text-white">Careers</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/" className="hover:text-white">Privacy</Link></li>
                <li><Link href="/" className="hover:text-white">Terms</Link></li>
                <li><Link href="/" className="hover:text-white">Disclaimers</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
            © 2025 TradeOS. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
