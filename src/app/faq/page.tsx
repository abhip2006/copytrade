/**
 * FAQ Page
 * Frequently Asked Questions about TradeOS
 */

"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { FAQSection, FAQSectionGradient } from "@/components/ui/faq-section";
import { HelpCircle, MessageCircle } from "lucide-react";
import { HeroHeader } from "@/components/blocks/hero-section-1";
import { AnimatedBackground } from "@/components/ui/animated-background";

const generalFAQs = [
  {
    question: "What is TradeOS and how does it work?",
    answer:
      "TradeOS is a platform that allows you to automatically replicate trades from verified professional traders in real-time. When a trader you're following executes a trade, our system instantly replicates it in your connected brokerage account based on your allocation settings. You maintain full control over risk parameters, position sizes, and which asset classes to copy.",
  },
  {
    question: "How much money do I need to start?",
    answer:
      "There's no minimum deposit required for the TradeOS platform itself. However, your connected brokerage account may have minimum balance requirements (typically $100-$500). We recommend starting with at least $500 to allow for proper diversification across multiple leaders and asset classes. You can start small and scale up as you gain confidence.",
  },
  {
    question: "What are the fees?",
    answer:
      "TradeOS charges no subscription fees or monthly payments. You only pay standard brokerage commissions when trades are executed in your account. Some leaders may charge a performance fee (typically 10-20%) on profits generated, which is clearly disclosed before you start copying. There are no hidden costs or surprise charges.",
  },
  {
    question: "Is my money safe? Who holds my funds?",
    answer:
      "Your funds remain in your own brokerage account at all times. TradeOS never has access to your money or credentials. We only have API permissions to execute trades on your behalf through SnapTrade's secure infrastructure. Your broker (like Interactive Brokers, TD Ameritrade, etc.) holds and protects your funds. You can withdraw, stop copying, or close your account at any time.",
  },
];

const tradingFAQs = [
  {
    question: "Can I stop copying trades at any time?",
    answer:
      "Yes, absolutely. You have complete control. You can pause copying from any leader instantly, and no new trades will be replicated. Existing positions will remain open unless you manually close them. You can also unfollow leaders, adjust allocation percentages, or stop using the platform entirely without any penalties or lock-in periods.",
  },
  {
    question: "What happens if I lose my internet connection?",
    answer:
      "Trade copying operates on our cloud servers, not on your device. If your internet disconnects, trades will continue to be copied as normal. You can check your account status from any device once you reconnect. Our infrastructure has 99.9% uptime and automatic failover systems to ensure continuous operation.",
  },
  {
    question: "Can I filter which trades get copied?",
    answer:
      "Yes! You have granular control over what gets copied. You can filter by asset class (stocks, ETFs, options, crypto), set maximum position sizes, exclude specific symbols, set stop-loss and take-profit levels, and configure risk limits. These filters apply automatically to all trades from leaders you follow.",
  },
  {
    question: "How fast are trades executed?",
    answer:
      "Trades are typically replicated in under 1 second from when the leader executes them. Our system uses SnapTrade's institutional-grade API infrastructure with direct exchange connections for minimal latency. During high volatility periods, execution may take 2-3 seconds, but slippage is minimal for liquid assets.",
  },
];

const leaderFAQs = [
  {
    question: "How do I become a leader?",
    answer:
      "To become a leader, you need to: (1) Have an active trading account connected for at least 3 months, (2) Show consistent profitability with verified track record, (3) Complete our leader verification process including identity verification and trading history review, (4) Maintain minimum account balance of $10,000. Once approved, you'll receive a verified badge and can start earning performance fees from followers.",
  },
  {
    question: "How are leaders verified?",
    answer:
      "Leaders go through a rigorous multi-step verification process: Identity verification through KYC, trading history audit (minimum 6 months of verified trades), performance metrics validation, risk assessment and Sharpe ratio analysis, and background check for regulatory compliance. Only about 15% of applicants are approved. Verified leaders receive a blue checkmark badge.",
  },
  {
    question: "Can I follow multiple leaders at once?",
    answer:
      "Yes! In fact, we strongly recommend following 3-5 leaders with different trading styles for diversification. You can allocate different percentages of your portfolio to each leader (e.g., 30% to a conservative trader, 40% to moderate risk, 30% to aggressive). This helps reduce risk and smooth out returns over time.",
  },
  {
    question: "What if a leader I'm following starts losing money?",
    answer:
      "You can unfollow any leader at any time with one click. We also provide real-time performance alerts—you can set thresholds like 'notify me if drawdown exceeds 15%' or 'stop copying if monthly loss exceeds 10%'. Our platform displays live ROI, win rate, maximum drawdown, and Sharpe ratio so you can make informed decisions.",
  },
];

const technicalFAQs = [
  {
    question: "Which brokerages are supported?",
    answer:
      "We support 20+ major brokerages through SnapTrade integration, including: Interactive Brokers, TD Ameritrade, E*TRADE, Charles Schwab, Robinhood, Webull, Alpaca, TradeStation, and more. If your broker isn't listed, contact support—we're constantly adding new integrations based on user demand.",
  },
  {
    question: "What asset classes can I copy?",
    answer:
      "Currently supported: US stocks (NYSE, NASDAQ), ETFs, stock options (calls/puts), and cryptocurrencies (Bitcoin, Ethereum via supported crypto brokers). Coming soon: Futures, forex, and international equities. You can enable/disable each asset class individually in your copy settings.",
  },
  {
    question: "Is there a mobile app?",
    answer:
      "Yes! Our mobile apps for iOS and Android allow you to: monitor your portfolio in real-time, follow/unfollow leaders, adjust copy settings, receive push notifications for trades, and view detailed analytics. The web platform offers additional advanced features like backtesting and detailed trade history. Both platforms sync automatically.",
  },
  {
    question: "How do I get support if I have issues?",
    answer:
      "We offer multiple support channels: Live chat (9 AM - 9 PM EST, Mon-Fri), email support with 24-hour response time, comprehensive knowledge base with video tutorials, and community forum with 10,000+ active traders. Premium users ($10k+ account) get priority phone support and a dedicated account manager.",
  },
];

export default function FAQPage() {
  return (
    <div className="min-h-screen relative">
      {/* Animated Background */}
      <AnimatedBackground />

      {/* Navigation */}
      <HeroHeader />

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-6">
        <div className="container mx-auto">
          <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full mb-6">
              <HelpCircle className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">
                Help Center
              </span>
            </div>

            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              Frequently Asked Questions
            </h1>

            <p className="text-xl text-gray-600 mb-8">
              Everything you need to know about TradeOS. Can&apos;t find what
              you&apos;re looking for? Chat with our team.
            </p>

            <Link href="/">
              <Button size="lg" className="gap-2">
                <MessageCircle className="w-4 h-4" />
                Contact Support
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ Sections */}
      <section className="py-16 px-6">
        <div className="container mx-auto max-w-5xl">
          {/* General Questions */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">
              General Questions
            </h2>
            <FAQSection faqs={generalFAQs} />
          </div>

          {/* Trading Questions */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">
              Trading & Operations
            </h2>
            <FAQSection faqs={tradingFAQs} />
          </div>

          {/* Leader Questions */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">
              Leaders & Following
            </h2>
            <FAQSection faqs={leaderFAQs} />
          </div>

          {/* Technical Questions */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">
              Technical & Platform
            </h2>
            <FAQSection faqs={technicalFAQs} />
          </div>
        </div>
      </section>

      {/* Still Have Questions Section */}
      <section className="py-20 px-6 bg-gradient-to-br from-gray-50 to-white">
        <div className="container mx-auto">
          <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1">
              <img
                className="rounded-xl shadow-2xl w-full h-auto object-cover"
                src="https://images.unsplash.com/photo-1553877522-43269d4ea984?w=600&h=600&fit=crop"
                alt="Customer support team"
              />
            </div>
            <div className="flex-1">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Still have questions?
              </h2>
              <p className="text-gray-600 mb-6">
                Can&apos;t find the answer you&apos;re looking for? Our friendly
                support team is here to help 24/7.
              </p>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                    <MessageCircle className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">
                      Live Chat
                    </div>
                    <div className="text-sm text-gray-600">
                      Get instant answers
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                    <HelpCircle className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">
                      Knowledge Base
                    </div>
                    <div className="text-sm text-gray-600">
                      Browse tutorials & guides
                    </div>
                  </div>
                </div>
              </div>
              <Button className="mt-6" size="lg">
                Contact Support Team
              </Button>
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
            Join thousands of investors who are already copying professional
            traders. Get started in minutes.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/sign-up">
              <Button size="lg" variant="secondary" className="h-12 px-8">
                Start Copying Free
              </Button>
            </Link>
            <Link href="/leaders">
              <Button
                size="lg"
                variant="outline"
                className="h-12 px-8 bg-transparent text-white border-white hover:bg-white/10"
              >
                Browse Top Traders
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
                <li>
                  <Link href="/features" className="hover:text-white">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="/leaders" className="hover:text-white">
                    Browse Leaders
                  </Link>
                </li>
                <li>
                  <Link href="/testimonials" className="hover:text-white">
                    Testimonials
                  </Link>
                </li>
                <li>
                  <Link href="/faq" className="hover:text-white">
                    FAQ
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/" className="hover:text-white">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="/" className="hover:text-white">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link href="/" className="hover:text-white">
                    Careers
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/" className="hover:text-white">
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link href="/" className="hover:text-white">
                    Terms
                  </Link>
                </li>
                <li>
                  <Link href="/" className="hover:text-white">
                    Disclaimers
                  </Link>
                </li>
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
