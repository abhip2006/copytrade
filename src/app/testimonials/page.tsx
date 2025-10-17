/**
 * Testimonials Page
 * Success stories from TradeOS users
 */

"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { TestimonialsColumn } from "@/components/ui/testimonials-columns";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";
// import { HeroHeader } from "@/components/blocks/hero-section-1";
// import { AnimatedBackground } from "@/components/ui/animated-background";

const testimonials = [
  {
    text: "TradeOS completely transformed my investment strategy. I went from losing money trying to trade on my own to consistently profitable by following verified traders. The platform is incredibly easy to use.",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop",
    name: "Sarah Mitchell",
    role: "Retail Investor",
  },
  {
    text: "As a beginner, I was intimidated by trading. TradeOS made it accessible. I started with small amounts, following conservative traders, and have grown my portfolio by 45% in 6 months. Game changer!",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop",
    name: "Michael Chen",
    role: "New Investor",
  },
  {
    text: "The transparency is incredible. You can see every trade, every stat, and verify everything before you commit. I&apos;ve been copying trades for 8 months and my returns have exceeded my expectations.",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop",
    name: "Jessica Williams",
    role: "Portfolio Manager",
  },
  {
    text: "I was skeptical at first, but the risk management tools gave me confidence. Being able to set stop-losses and position limits means I sleep well at night. My account is up 62% year-to-date.",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop",
    name: "David Rodriguez",
    role: "Financial Analyst",
  },
  {
    text: "TradeOS saved me countless hours of research and analysis. I follow 3 different traders with different strategies, and the diversification has really paid off. Platform is rock solid.",
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop",
    name: "Emily Thompson",
    role: "Busy Professional",
  },
  {
    text: "The real-time execution is impressive. Trades are replicated almost instantly. I&apos;ve compared timestamps with my leader&apos;s trades and the latency is under 1 second. Truly institutional-grade.",
    image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop",
    name: "James Anderson",
    role: "Tech Entrepreneur",
  },
  {
    text: "What I love most is the flexibility. I can adjust my allocation per trader, filter asset classes, and customize everything to my risk tolerance. It&apos;s like having a personal trading assistant.",
    image: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400&h=400&fit=crop",
    name: "Sophia Martinez",
    role: "Investment Advisor",
  },
  {
    text: "I&apos;ve tried other copy trading platforms, but TradeOS is by far the best. The leader verification process is thorough, and the performance metrics are transparent. No hidden tricks.",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop",
    name: "Robert Taylor",
    role: "Retired Investor",
  },
  {
    text: "Started with just $500 to test it out. Three months later, I moved my entire trading account over. The ability to follow multiple strategies simultaneously is brilliant for diversification.",
    image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=400&fit=crop",
    name: "Amanda Lee",
    role: "Marketing Executive",
  },
];

const firstColumn = testimonials.slice(0, 3);
const secondColumn = testimonials.slice(3, 6);
const thirdColumn = testimonials.slice(6, 9);

export default function TestimonialsPage() {
  return (
    <div className="min-h-screen relative">
      {/* Animated Background */}
      <AnimatedBackground />

      {/* Navigation */}
      <HeroHeader />

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-6">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            viewport={{ once: true }}
            className="flex flex-col items-center justify-center max-w-[640px] mx-auto text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full mb-6">
              <Star className="w-4 h-4 text-blue-600 fill-blue-600" />
              <span className="text-sm font-medium text-blue-900">Trusted by Thousands</span>
            </div>

            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              What Our Users Say
            </h1>

            <p className="text-xl text-gray-600 mb-8">
              Real stories from real traders who transformed their investment journey with TradeOS.
            </p>

            <div className="flex items-center gap-6 mb-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">10,000+</div>
                <div className="text-sm text-gray-600">Active Users</div>
              </div>
              <div className="w-px h-12 bg-gray-300"></div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">$50M+</div>
                <div className="text-sm text-gray-600">Assets Copied</div>
              </div>
              <div className="w-px h-12 bg-gray-300"></div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">4.9/5</div>
                <div className="text-sm text-gray-600">User Rating</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Testimonials Columns */}
      <section className="py-16 px-6">
        <div className="container mx-auto">
          <div className="flex justify-center gap-6 [mask-image:linear-gradient(to_bottom,transparent,black_15%,black_85%,transparent)] max-h-[800px] overflow-hidden">
            <TestimonialsColumn testimonials={firstColumn} duration={20} />
            <TestimonialsColumn
              testimonials={secondColumn}
              className="hidden md:block"
              duration={24}
            />
            <TestimonialsColumn
              testimonials={thirdColumn}
              className="hidden lg:block"
              duration={22}
            />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-6 bg-white">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Results That Speak for Themselves
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Join thousands of investors who are already achieving their financial goals
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">85%</div>
              <div className="text-gray-600">User Satisfaction Rate</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">2.5x</div>
              <div className="text-gray-600">Average Portfolio Growth</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">24/7</div>
              <div className="text-gray-600">Platform Uptime</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">&lt;1s</div>
              <div className="text-gray-600">Trade Execution Time</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-br from-blue-600 to-blue-800">
        <div className="container mx-auto text-center max-w-3xl">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Join Them?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Start copying professional traders today. No credit card required to get started.
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
