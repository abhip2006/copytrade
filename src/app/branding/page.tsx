/**
 * TradeOS Branding Showcase
 * Internal page to view all logo variations and branding guidelines
 */

'use client';

import { TradeOSLogo, TradeOSLogoCompact, TradeOSLogoIcon, TradeOSLogoHero, TradeOSWordmark } from '@/components/branding/tradeos-logo';
import { TradeOSLogoMinimal } from '@/components/branding/tradeos-logo-minimal';

export default function BrandingPage() {
  return (
    <div className="min-h-screen bg-[var(--background)] p-8">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-4 pb-8 border-b border-[var(--border)]">
          <h1 className="text-4xl font-bold text-[var(--foreground)]">TradeOS Branding</h1>
          <p className="text-[var(--foreground-secondary)] text-lg">
            Logo variations and usage guidelines
          </p>
        </div>

        {/* Primary Logo Variations */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold text-[var(--foreground)]">Primary Logo</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Full Logo - Different Sizes */}
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-8 space-y-6">
              <h3 className="text-sm font-semibold text-[var(--foreground-secondary)] uppercase tracking-wide">
                Full Logo Sizes
              </h3>
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-[var(--background)] rounded-lg">
                  <span className="text-xs text-[var(--foreground-tertiary)] w-12">XL</span>
                  <TradeOSLogo variant="full" size="xl" />
                </div>
                <div className="flex items-center gap-4 p-4 bg-[var(--background)] rounded-lg">
                  <span className="text-xs text-[var(--foreground-tertiary)] w-12">LG</span>
                  <TradeOSLogo variant="full" size="lg" />
                </div>
                <div className="flex items-center gap-4 p-4 bg-[var(--background)] rounded-lg">
                  <span className="text-xs text-[var(--foreground-tertiary)] w-12">MD</span>
                  <TradeOSLogo variant="full" size="md" />
                </div>
                <div className="flex items-center gap-4 p-4 bg-[var(--background)] rounded-lg">
                  <span className="text-xs text-[var(--foreground-tertiary)] w-12">SM</span>
                  <TradeOSLogo variant="full" size="sm" />
                </div>
              </div>
            </div>

            {/* Icon Only */}
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-8 space-y-6">
              <h3 className="text-sm font-semibold text-[var(--foreground-secondary)] uppercase tracking-wide">
                Icon Only
              </h3>
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-[var(--background)] rounded-lg">
                  <span className="text-xs text-[var(--foreground-tertiary)] w-12">XL</span>
                  <TradeOSLogoIcon size="xl" />
                </div>
                <div className="flex items-center gap-4 p-4 bg-[var(--background)] rounded-lg">
                  <span className="text-xs text-[var(--foreground-tertiary)] w-12">LG</span>
                  <TradeOSLogoIcon size="lg" />
                </div>
                <div className="flex items-center gap-4 p-4 bg-[var(--background)] rounded-lg">
                  <span className="text-xs text-[var(--foreground-tertiary)] w-12">MD</span>
                  <TradeOSLogoIcon size="md" />
                </div>
                <div className="flex items-center gap-4 p-4 bg-[var(--background)] rounded-lg">
                  <span className="text-xs text-[var(--foreground-tertiary)] w-12">SM</span>
                  <TradeOSLogoIcon size="sm" />
                </div>
              </div>
            </div>

            {/* Wordmark Only */}
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-8 space-y-6">
              <h3 className="text-sm font-semibold text-[var(--foreground-secondary)] uppercase tracking-wide">
                Wordmark Only
              </h3>
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-[var(--background)] rounded-lg">
                  <span className="text-xs text-[var(--foreground-tertiary)] w-12">XL</span>
                  <TradeOSWordmark size="xl" />
                </div>
                <div className="flex items-center gap-4 p-4 bg-[var(--background)] rounded-lg">
                  <span className="text-xs text-[var(--foreground-tertiary)] w-12">LG</span>
                  <TradeOSWordmark size="lg" />
                </div>
                <div className="flex items-center gap-4 p-4 bg-[var(--background)] rounded-lg">
                  <span className="text-xs text-[var(--foreground-tertiary)] w-12">MD</span>
                  <TradeOSWordmark size="md" />
                </div>
                <div className="flex items-center gap-4 p-4 bg-[var(--background)] rounded-lg">
                  <span className="text-xs text-[var(--foreground-tertiary)] w-12">SM</span>
                  <TradeOSWordmark size="sm" />
                </div>
              </div>
            </div>

            {/* Compact Version */}
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-8 space-y-6">
              <h3 className="text-sm font-semibold text-[var(--foreground-secondary)] uppercase tracking-wide">
                Compact (Navigation)
              </h3>
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-[var(--background)] rounded-lg">
                  <TradeOSLogoCompact />
                </div>
                <p className="text-xs text-[var(--foreground-tertiary)]">
                  Used in headers and navigation bars
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Minimal Logo */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold text-[var(--foreground)]">Minimal Logo</h2>
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="flex flex-col items-center gap-4 p-4 bg-[var(--background)] rounded-lg">
                <TradeOSLogoMinimal variant="full" size="xl" />
                <span className="text-xs text-[var(--foreground-tertiary)]">Full XL</span>
              </div>
              <div className="flex flex-col items-center gap-4 p-4 bg-[var(--background)] rounded-lg">
                <TradeOSLogoMinimal variant="full" size="lg" />
                <span className="text-xs text-[var(--foreground-tertiary)]">Full LG</span>
              </div>
              <div className="flex flex-col items-center gap-4 p-4 bg-[var(--background)] rounded-lg">
                <TradeOSLogoMinimal variant="icon" size="lg" />
                <span className="text-xs text-[var(--foreground-tertiary)]">Icon LG</span>
              </div>
              <div className="flex flex-col items-center gap-4 p-4 bg-[var(--background)] rounded-lg">
                <TradeOSLogoMinimal variant="text" size="lg" />
                <span className="text-xs text-[var(--foreground-tertiary)]">Text LG</span>
              </div>
            </div>
          </div>
        </section>

        {/* Dark Background Examples */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold text-[var(--foreground)]">On Dark Backgrounds</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-900 border border-slate-700 rounded-xl p-8 flex items-center justify-center">
              <TradeOSLogoHero />
            </div>
            <div className="bg-indigo-950 border border-indigo-800 rounded-xl p-8 flex items-center justify-center">
              <TradeOSLogoCompact />
            </div>
          </div>
        </section>

        {/* Usage Guidelines */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold text-[var(--foreground)]">Usage Guidelines</h2>
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-8 space-y-4">
            <div>
              <h3 className="font-semibold text-[var(--foreground)] mb-2">Spacing</h3>
              <p className="text-sm text-[var(--foreground-secondary)]">
                Maintain minimum clearance around the logo equal to the height of the "T" letter
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-[var(--foreground)] mb-2">Colors</h3>
              <p className="text-sm text-[var(--foreground-secondary)]">
                Logo uses theme variables: --primary (Indigo) and --accent (Sky Blue)
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-[var(--foreground)] mb-2">Don'ts</h3>
              <ul className="text-sm text-[var(--foreground-secondary)] list-disc list-inside space-y-1">
                <li>Don't alter the gradient colors</li>
                <li>Don't rotate or skew the logo</li>
                <li>Don't add drop shadows or effects</li>
                <li>Don't use the icon and text at different sizes</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Code Examples */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold text-[var(--foreground)]">Code Examples</h2>
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-8 space-y-4">
            <div>
              <h3 className="font-mono text-sm font-semibold text-[var(--foreground)] mb-2">
                {'<TradeOSLogoCompact />'}
              </h3>
              <p className="text-xs text-[var(--foreground-secondary)]">
                Default navigation logo (32px height)
              </p>
            </div>
            <div>
              <h3 className="font-mono text-sm font-semibold text-[var(--foreground)] mb-2">
                {'<TradeOSLogoHero />'}
              </h3>
              <p className="text-xs text-[var(--foreground-secondary)]">
                Large hero logo for landing pages (48px height)
              </p>
            </div>
            <div>
              <h3 className="font-mono text-sm font-semibold text-[var(--foreground)] mb-2">
                {'<TradeOSLogoIcon size="lg" />'}
              </h3>
              <p className="text-xs text-[var(--foreground-secondary)]">
                Icon only for favicons, app icons
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
