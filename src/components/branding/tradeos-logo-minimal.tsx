/**
 * TradeOS Minimal Logo Component
 * Ultra-clean, minimalist version for modern aesthetic
 */

import React from 'react';

interface MinimalLogoProps {
  variant?: 'full' | 'icon' | 'text';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function TradeOSLogoMinimal({
  variant = 'full',
  size = 'md',
  className = ''
}: MinimalLogoProps) {
  const sizes = {
    sm: { height: 24, iconSize: 24, fontSize: 16 },
    md: { height: 32, iconSize: 32, fontSize: 20 },
    lg: { height: 40, iconSize: 40, fontSize: 24 },
    xl: { height: 48, iconSize: 48, fontSize: 28 },
  };

  const { height, iconSize, fontSize } = sizes[size];

  // Minimalist icon - Abstract geometric shape
  const LogoIcon = () => (
    <svg
      width={iconSize}
      height={iconSize}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="tradeos-logo-minimal"
    >
      <defs>
        <linearGradient id="minimal-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgb(var(--primary))" />
          <stop offset="100%" stopColor="rgb(var(--accent))" />
        </linearGradient>
      </defs>

      {/* Rounded square container */}
      <rect
        x="15"
        y="15"
        width="70"
        height="70"
        rx="16"
        fill="url(#minimal-gradient)"
        opacity="0.1"
      />

      {/* Stylized "T" using geometric shapes */}
      <g fill="url(#minimal-gradient)">
        {/* Top bar of T */}
        <rect x="30" y="30" width="40" height="6" rx="3" />

        {/* Vertical bar of T */}
        <rect x="47" y="30" width="6" height="40" rx="3" />
      </g>

      {/* Sync indicator - two parallel arrows */}
      <g stroke="url(#minimal-gradient)" strokeWidth="2.5" fill="none" strokeLinecap="round">
        <path d="M 60 55 L 70 55 L 67 52 M 70 55 L 67 58" opacity="0.6" />
        <path d="M 40 65 L 30 65 L 33 62 M 30 65 L 33 68" opacity="0.6" />
      </g>
    </svg>
  );

  // Clean text logo
  const LogoText = () => (
    <span
      className="font-bold tracking-tight"
      style={{ fontSize: `${fontSize}px` }}
    >
      <span className="gradient-text">Trade</span>
      <span className="text-[var(--foreground)] opacity-80">OS</span>
    </span>
  );

  return (
    <div
      className={`inline-flex items-center gap-2.5 ${className}`}
      style={{ height: `${height}px` }}
    >
      {(variant === 'full' || variant === 'icon') && <LogoIcon />}
      {(variant === 'full' || variant === 'text') && <LogoText />}
    </div>
  );
}
