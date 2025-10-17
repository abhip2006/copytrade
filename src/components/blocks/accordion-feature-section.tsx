"use client";

import { useState } from "react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface FeatureItem {
  id: number;
  title: string;
  image: string;
  description: string;
}

interface AccordionFeatureSectionProps {
  features: FeatureItem[];
}

const defaultFeatures: FeatureItem[] = [
  {
    id: 1,
    title: "Automated Trade Copying",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&h=900&fit=crop&q=80",
    description:
      "Automatically replicate trades from verified professional traders in real-time. Set your allocation strategy and let our platform handle execution with sub-second latency. Never miss an opportunity while maintaining complete control over your risk parameters.",
  },
  {
    id: 2,
    title: "Discover Top Traders",
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=900&fit=crop&q=80",
    description:
      "Browse and follow verified trading professionals with transparent performance metrics. Filter by trading style, risk level, asset classes, and historical returns. Our verification process ensures you're following legitimate traders with proven track records.",
  },
  {
    id: 3,
    title: "Advanced Risk Management",
    image: "https://images.unsplash.com/photo-1642790551116-18e150f248e8?w=1200&h=900&fit=crop&q=80",
    description:
      "Protect your capital with customizable risk controls including stop-loss, take-profit, and position sizing rules. Set portfolio limits and filter which asset classes to copy. Our risk management tools help you sleep well at night while your investments work for you.",
  },
  {
    id: 4,
    title: "Real-Time Analytics",
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=900&fit=crop&q=80",
    description:
      "Track performance with detailed analytics dashboards showing ROI, win rate, Sharpe ratio, and drawdown metrics. Monitor every trade in real-time and understand exactly which strategies are working. Data-driven insights help you optimize your copy trading portfolio.",
  },
  {
    id: 5,
    title: "Secure Brokerage Integration",
    image: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=1200&h=900&fit=crop&q=80",
    description:
      "Connect your existing brokerage account securely through SnapTrade. We never store your credentials or have direct access to your funds. Your money stays in your account at all times, protected by your broker's security and insurance. Trade with confidence knowing your assets are safe.",
  },
];

const AccordionFeatureSection = ({ features = defaultFeatures }: AccordionFeatureSectionProps) => {
  const [activeTabId, setActiveTabId] = useState<number | null>(1);
  const [activeImage, setActiveImage] = useState(features[0].image);

  return (
    <section className="py-32">
      <div className="container mx-auto">
        <div className="mb-12 flex w-full items-start justify-between gap-12">
          <div className="w-full md:w-1/2">
            <Accordion type="single" className="w-full" defaultValue="item-1">
              {features.map((tab) => (
                <AccordionItem key={tab.id} value={`item-${tab.id}`}>
                  <AccordionTrigger
                    onClick={() => {
                      setActiveImage(tab.image);
                      setActiveTabId(tab.id);
                    }}
                    className="cursor-pointer py-5 !no-underline transition"
                  >
                    <h6
                      className={`text-xl font-semibold ${tab.id === activeTabId ? "text-foreground" : "text-muted-foreground"}`}
                    >
                      {tab.title}
                    </h6>
                  </AccordionTrigger>
                  <AccordionContent>
                    <p className="mt-3 text-muted-foreground">
                      {tab.description}
                    </p>
                    <div className="mt-4 md:hidden">
                      <img
                        src={tab.image}
                        alt={tab.title}
                        className="h-full max-h-80 w-full rounded-md object-cover"
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
          <div className="relative m-auto hidden w-1/2 overflow-hidden rounded-xl bg-muted md:block">
            <img
              src={activeImage}
              alt="Feature preview"
              className="aspect-[4/3] rounded-md object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export { AccordionFeatureSection };
