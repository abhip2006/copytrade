/**
 * TradeOS Logo Component
 * Modern, scalable SVG logo for the TradeOS platform
 */

import React from 'react';

interface TradeOSLogoProps {
  variant?: 'full' | 'icon' | 'text';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function TradeOSLogo({
  variant = 'full',
  size = 'md',
  className = ''
}: TradeOSLogoProps) {
  const sizes = {
    sm: { height: 24, iconSize: 24, fontSize: 16 },
    md: { height: 32, iconSize: 32, fontSize: 20 },
    lg: { height: 40, iconSize: 40, fontSize: 24 },
    xl: { height: 48, iconSize: 48, fontSize: 28 },
  };

  const { height, iconSize, fontSize } = sizes[size];

  // Logo icon - Geometric representation of synchronized trading
  const LogoIcon = () => (
    <svg
      width={iconSize}
      height={iconSize}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="tradeos-logo-icon"
    >
      {/* Background circle with gradient */}
      <defs>
        <linearGradient id="tradeos-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgb(var(--primary))" />
          <stop offset="100%" stopColor="rgb(var(--accent))" />
        </linearGradient>
        <linearGradient id="tradeos-glow" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgb(var(--primary))" stopOpacity="0.2" />
          <stop offset="100%" stopColor="rgb(var(--accent))" stopOpacity="0.1" />
        </linearGradient>
      </defs>

      {/* Outer glow circle */}
      <circle cx="50" cy="50" r="48" fill="url(#tradeos-glow)" />

      {/* Main circle background */}
      <circle cx="50" cy="50" r="42" fill="url(#tradeos-gradient)" opacity="0.1" />

      {/* Abstract "T" shape representing Trade */}
      <path
        d="M 30 25 L 70 25 L 70 32 L 54 32 L 54 75 L 46 75 L 46 32 L 30 32 Z"
        fill="url(#tradeos-gradient)"
      />

      {/* Synchronized wave pattern - representing copy trading */}
      <path
        d="M 25 55 Q 35 50, 45 55 T 65 55 T 75 55"
        stroke="url(#tradeos-gradient)"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        opacity="0.6"
      />

      <path
        d="M 25 65 Q 35 60, 45 65 T 65 65 T 75 65"
        stroke="url(#tradeos-gradient)"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        opacity="0.4"
      />
    </svg>
  );

  // Logo text with modern styling
  const LogoText = () => (
    <span
      className="tradeos-logo-text font-bold tracking-tight"
      style={{ fontSize: `${fontSize}px` }}
    >
      <span className="gradient-text">Trade</span>
      <span className="text-[var(--foreground)]">OS</span>
    </span>
  );

  return (
    <div
      className={`tradeos-logo inline-flex items-center gap-2 ${className}`}
      style={{ height: `${height}px` }}
    >
      {(variant === 'full' || variant === 'icon') && <LogoIcon />}
      {(variant === 'full' || variant === 'text') && <LogoText />}
    </div>
  );
}

/**
 * Compact version for navigation/header
 */
export function TradeOSLogoCompact({ className = '' }: { className?: string }) {
  return <TradeOSLogo variant="full" size="md" className={className} />;
}

/**
 * Icon only version for mobile/small spaces
 */
export function TradeOSLogoIcon({ size = 'md', className = '' }: { size?: 'sm' | 'md' | 'lg' | 'xl', className?: string }) {
  return <TradeOSLogo variant="icon" size={size} className={className} />;
}

/**
 * Large version for landing page hero
 */
export function TradeOSLogoHero({ className = '' }: { className?: string }) {
  return <TradeOSLogo variant="full" size="xl" className={className} />;
}

/**
 * Simple wordmark (text only)
 */
export function TradeOSWordmark({ size = 'md', className = '' }: { size?: 'sm' | 'md' | 'lg' | 'xl', className?: string }) {
  return <TradeOSLogo variant="text" size={size} className={className} />;
}
