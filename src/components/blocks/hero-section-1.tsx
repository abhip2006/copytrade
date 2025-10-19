"use client"
// @ts-nocheck
import React from 'react'
import Link from 'next/link'
import { ArrowRight, ChevronRight, Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AnimatedGroup } from '@/components/ui/animated-group'
import { Marquee } from '@/components/ui/marquee'
import { cn } from '@/lib/utils'

const transitionVariants = {
    item: {
        hidden: {
            opacity: 0,
            filter: 'blur(12px)',
            y: 12,
        },
        visible: {
            opacity: 1,
            filter: 'blur(0px)',
            y: 0,
            transition: {
                type: 'spring',
                bounce: 0.3,
                duration: 1.5,
            },
        },
    },
}

export function HeroSection() {
    return (
        <>
            <HeroHeader />
            <main className="overflow-hidden">
                <div
                    aria-hidden
                    className="z-[2] absolute inset-0 pointer-events-none isolate opacity-40 contain-strict hidden lg:block">
                    {/* Stock chart pattern background */}
                    <svg className="absolute left-0 top-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
                        {/* Candlestick chart pattern */}
                        <path
                            d="M50 200 L50 150 M50 150 L60 160 L60 190 L50 200 M60 175 L70 175 M100 300 L100 250 M100 250 L110 260 L110 290 L100 300 M110 275 L120 275 M150 180 L150 130 M150 130 L160 140 L160 170 L150 180 M160 155 L170 155 M200 350 L200 300 M200 300 L210 310 L210 340 L200 350 M210 325 L220 325 M250 220 L250 170 M250 170 L260 180 L260 210 L250 220 M260 195 L270 195"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            fill="none"
                            className="text-gray-300/20 dark:text-gray-700/20"
                            transform="scale(3) translate(-50, -20) rotate(-15)"
                        />
                        {/* Line chart trending upward */}
                        <path
                            d="M0 400 L100 380 L200 320 L300 340 L400 280 L500 260 L600 220 L700 200 L800 180 L900 160 L1000 140"
                            stroke="currentColor"
                            strokeWidth="2"
                            fill="none"
                            className="text-emerald-500/10 dark:text-emerald-400/10"
                            transform="translate(100, 50)"
                        />
                        {/* Dotted grid pattern */}
                        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                            <circle cx="1" cy="1" r="1" fill="currentColor" className="text-gray-400/10 dark:text-gray-600/10" />
                        </pattern>
                        <rect width="100%" height="100%" fill="url(#grid)" />
                        {/* Price ticker symbols */}
                        <text x="70%" y="15%" fontSize="120" fontWeight="bold" fill="currentColor" className="text-gray-200/5 dark:text-gray-800/5" fontFamily="monospace">$</text>
                        <text x="10%" y="80%" fontSize="80" fontWeight="bold" fill="currentColor" className="text-gray-200/5 dark:text-gray-800/5" fontFamily="monospace">↗</text>
                    </svg>
                </div>
                <section>
                    <div className="relative pt-24 md:pt-36">
                        <AnimatedGroup
                            variants={{...{} as any,
                                container: {
                                    visible: {
                                        transition: {
                                            delayChildren: 1,
                                        },
                                    },
                                },
                                item: {
                                    hidden: {
                                        opacity: 0,
                                        y: 20,
                                    },
                                    visible: {
                                        opacity: 1,
                                        y: 0,
                                        transition: {
                                            type: 'spring',
                                            bounce: 0.3,
                                            duration: 2,
                                        },
                                    },
                                },
                            }}
                            className="absolute inset-0 -z-20">
                            <img
                                src="https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=3276&h=4095&fit=crop"
                                alt="background"
                                className="absolute inset-x-0 top-56 -z-20 hidden lg:top-32 dark:block object-cover w-full h-full"
                                width="3276"
                                height="4095"
                            />
                        </AnimatedGroup>
                        <div aria-hidden className="absolute inset-0 -z-10 size-full [background:radial-gradient(125%_125%_at_50%_100%,transparent_0%,var(--background)_75%)]" />
                        <div className="mx-auto max-w-7xl px-6">
                            <div className="text-center sm:mx-auto lg:mr-auto lg:mt-0">
                                <AnimatedGroup variants={transitionVariants as any}>
                                    <Link
                                        href="/sign-up"
                                        className="hover:bg-background dark:hover:border-t-border bg-muted group mx-auto flex w-fit items-center gap-4 rounded-full border p-1 pl-4 shadow-md shadow-black/5 transition-all duration-300 dark:border-t-white/5 dark:shadow-zinc-950">
                                        <span className="text-foreground text-sm">Trusted by 12,500+ traders</span>
                                        <span className="dark:border-background block h-4 w-0.5 border-l bg-white dark:bg-zinc-700"></span>

                                        <div className="bg-background group-hover:bg-muted size-6 overflow-hidden rounded-full duration-500">
                                            <div className="flex w-12 -translate-x-1/2 duration-500 ease-in-out group-hover:translate-x-0">
                                                <span className="flex size-6">
                                                    <ArrowRight className="m-auto size-3" />
                                                </span>
                                                <span className="flex size-6">
                                                    <ArrowRight className="m-auto size-3" />
                                                </span>
                                            </div>
                                        </div>
                                    </Link>

                                    <h1
                                        className="mt-8 max-w-4xl mx-auto text-balance text-6xl md:text-7xl lg:mt-16 xl:text-[5.25rem] font-bold">
                                        Copy trades from <span className="gradient-text">elite traders</span> automatically
                                    </h1>
                                    <p
                                        className="mx-auto mt-8 max-w-2xl text-balance text-lg text-gray-600">
                                        Mirror successful trading strategies in real-time. No experience required. Start building wealth with professional traders.
                                    </p>
                                </AnimatedGroup>

                                <AnimatedGroup
                                    variants={{...{} as any,
                                        container: {
                                            visible: {
                                                transition: {
                                                    staggerChildren: 0.05,
                                                    delayChildren: 0.75,
                                                },
                                            },
                                        },
                                        ...transitionVariants,
                                    }}
                                    className="mt-12 flex flex-col items-center justify-center gap-2 md:flex-row">
                                    <div
                                        key={1}
                                        className="bg-foreground/10 rounded-[14px] border p-0.5">
                                        <Button
                                            asChild
                                            size="lg"
                                            className="rounded-xl px-5 text-base">
                                            <Link href="/sign-up" className="text-nowrap">Start copying free</Link>
                                        </Button>
                                    </div>
                                    <Button
                                        key={2}
                                        asChild
                                        size="lg"
                                        variant="ghost"
                                        className="h-10.5 rounded-xl px-5">
                                        <Link href="/leaders" className="text-nowrap">Browse leaders</Link>
                                    </Button>
                                </AnimatedGroup>
                            </div>
                        </div>

                        <AnimatedGroup
                            variants={{...{} as any,
                                container: {
                                    visible: {
                                        transition: {
                                            staggerChildren: 0.05,
                                            delayChildren: 0.75,
                                        },
                                    },
                                },
                                ...transitionVariants,
                            }}>
                            <div className="relative -mr-56 mt-8 overflow-hidden px-2 sm:mr-0 sm:mt-12 md:mt-20">
                                <div
                                    aria-hidden
                                    className="bg-gradient-to-b to-background absolute inset-0 z-10 from-transparent from-35%"
                                />
                                <div className="inset-shadow-2xs ring-background dark:inset-shadow-white/20 bg-background relative mx-auto max-w-6xl overflow-hidden rounded-2xl border p-4 shadow-lg shadow-zinc-950/15 ring-1">
                                    <img
                                        className="bg-background aspect-15/8 relative hidden rounded-2xl dark:block"
                                        src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=2700&h=1440&fit=crop&q=75"
                                        alt="Trading dashboard - dark mode"
                                        width="2700"
                                        height="1440"
                                    />
                                    <img
                                        className="z-2 border-border/25 aspect-15/8 relative rounded-2xl border dark:hidden"
                                        src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=2700&h=1440&fit=crop&q=75"
                                        alt="Trading dashboard - light mode"
                                        width="2700"
                                        height="1440"
                                    />
                                </div>
                            </div>
                        </AnimatedGroup>
                    </div>
                </section>
                <section className="bg-background pb-16 pt-8 md:pb-32">
                    <div className="mx-auto max-w-7xl">
                        <p className="text-center text-sm font-medium text-gray-500 mb-8">Trusted by traders worldwide</p>
                        <Marquee pauseOnHover={true} speed={40} className="mt-0 sm:mt-0">
                            <div className="relative h-full w-fit mx-[4rem] flex items-center justify-start">
                                <img
                                    className="h-6 w-fit dark:invert opacity-60 hover:opacity-100 transition-opacity"
                                    src="https://html.tailus.io/blocks/customers/nvidia.svg"
                                    alt="Nvidia Logo"
                                    height="24"
                                    width="auto"
                                />
                            </div>
                            <div className="relative h-full w-fit mx-[4rem] flex items-center justify-start">
                                <img
                                    className="h-5 w-fit dark:invert opacity-60 hover:opacity-100 transition-opacity"
                                    src="https://html.tailus.io/blocks/customers/column.svg"
                                    alt="Column Logo"
                                    height="20"
                                    width="auto"
                                />
                            </div>
                            <div className="relative h-full w-fit mx-[4rem] flex items-center justify-start">
                                <img
                                    className="h-5 w-fit dark:invert opacity-60 hover:opacity-100 transition-opacity"
                                    src="https://html.tailus.io/blocks/customers/github.svg"
                                    alt="GitHub Logo"
                                    height="20"
                                    width="auto"
                                />
                            </div>
                            <div className="relative h-full w-fit mx-[4rem] flex items-center justify-start">
                                <img
                                    className="h-6 w-fit dark:invert opacity-60 hover:opacity-100 transition-opacity"
                                    src="https://html.tailus.io/blocks/customers/nike.svg"
                                    alt="Nike Logo"
                                    height="24"
                                    width="auto"
                                />
                            </div>
                            <div className="relative h-full w-fit mx-[4rem] flex items-center justify-start">
                                <img
                                    className="h-6 w-fit dark:invert opacity-60 hover:opacity-100 transition-opacity"
                                    src="https://html.tailus.io/blocks/customers/lemonsqueezy.svg"
                                    alt="Lemon Squeezy Logo"
                                    height="24"
                                    width="auto"
                                />
                            </div>
                            <div className="relative h-full w-fit mx-[4rem] flex items-center justify-start">
                                <img
                                    className="h-5 w-fit dark:invert opacity-60 hover:opacity-100 transition-opacity"
                                    src="https://html.tailus.io/blocks/customers/laravel.svg"
                                    alt="Laravel Logo"
                                    height="20"
                                    width="auto"
                                />
                            </div>
                            <div className="relative h-full w-fit mx-[4rem] flex items-center justify-start">
                                <img
                                    className="h-7 w-fit dark:invert opacity-60 hover:opacity-100 transition-opacity"
                                    src="https://html.tailus.io/blocks/customers/lilly.svg"
                                    alt="Lilly Logo"
                                    height="28"
                                    width="auto"
                                />
                            </div>
                            <div className="relative h-full w-fit mx-[4rem] flex items-center justify-start">
                                <img
                                    className="h-6 w-fit dark:invert opacity-60 hover:opacity-100 transition-opacity"
                                    src="https://html.tailus.io/blocks/customers/openai.svg"
                                    alt="OpenAI Logo"
                                    height="24"
                                    width="auto"
                                />
                            </div>
                        </Marquee>
                    </div>
                </section>
            </main>
        </>
    )
}

const menuItems = [
    { name: 'Features', href: '/features' },
    { name: 'Leaders', href: '/leaders' },
    { name: 'Testimonials', href: '/testimonials' },
    { name: 'FAQ', href: '/faq' },
]

export const HeroHeader = () => {
    const [menuState, setMenuState] = React.useState(false)
    const [isScrolled, setIsScrolled] = React.useState(false)

    React.useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50)
        }
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])
    return (
        <header>
            <nav
                data-state={menuState && 'active'}
                className="fixed z-50 w-full px-2 group">
                <div className={cn('mx-auto mt-2 max-w-7xl px-6 transition-all duration-300 lg:px-12', isScrolled && 'bg-white/90 max-w-5xl rounded-2xl border border-gray-200 backdrop-blur-xl shadow-lg lg:px-6')}>
                    <div className="relative flex flex-wrap items-center justify-between gap-6 py-3 lg:gap-0 lg:py-4">
                        <div className="flex w-full justify-between lg:w-auto">
                            <Link
                                href="/"
                                aria-label="home"
                                className="flex items-center space-x-2">
                                <Logo />
                            </Link>

                            <button
                                onClick={() => setMenuState(!menuState)}
                                aria-label={menuState == true ? 'Close Menu' : 'Open Menu'}
                                className="relative z-20 -m-2.5 -mr-4 block cursor-pointer p-2.5 lg:hidden text-gray-700">
                                <Menu className="in-data-[state=active]:rotate-180 group-data-[state=active]:scale-0 group-data-[state=active]:opacity-0 m-auto size-6 duration-200" />
                                <X className="group-data-[state=active]:rotate-0 group-data-[state=active]:scale-100 group-data-[state=active]:opacity-100 absolute inset-0 m-auto size-6 -rotate-180 scale-0 opacity-0 duration-200" />
                            </button>
                        </div>

                        <div className="absolute inset-0 m-auto hidden size-fit lg:block">
                            <ul className="flex gap-8 text-sm font-medium">
                                {menuItems.map((item, index) => (
                                    <li key={index}>
                                        <Link
                                            href={item.href}
                                            className="text-gray-600 hover:text-gray-900 block duration-150 transition-colors">
                                            <span>{item.name}</span>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="bg-white group-data-[state=active]:block lg:group-data-[state=active]:flex mb-6 hidden w-full flex-wrap items-center justify-end space-y-8 rounded-3xl border border-gray-200 p-6 shadow-2xl md:flex-nowrap lg:m-0 lg:flex lg:w-fit lg:gap-3 lg:space-y-0 lg:border-transparent lg:bg-transparent lg:p-0 lg:shadow-none">
                            <div className="lg:hidden">
                                <ul className="space-y-6 text-base">
                                    {menuItems.map((item, index) => (
                                        <li key={index}>
                                            <Link
                                                href={item.href}
                                                className="text-gray-600 hover:text-gray-900 block duration-150">
                                                <span>{item.name}</span>
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="flex w-full flex-col space-y-3 sm:flex-row sm:gap-3 sm:space-y-0 md:w-fit">
                                <Button
                                    asChild
                                    variant="ghost"
                                    size="sm"
                                    className={cn('text-gray-700', isScrolled && 'lg:hidden')}>
                                    <Link href="/sign-in">Login</Link>
                                </Button>
                                <Button
                                    asChild
                                    size="sm"
                                    className={cn('bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm', isScrolled && 'lg:hidden')}>
                                    <Link href="/sign-up">Sign Up</Link>
                                </Button>
                                <Button
                                    asChild
                                    size="sm"
                                    className={cn('bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm', isScrolled ? 'lg:inline-flex' : 'hidden')}>
                                    <Link href="/sign-up">Get Started</Link>
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>
        </header>
    )
}

const Logo = ({ className }: { className?: string }) => {
    return (
        <div className={cn('flex items-center gap-2', className)}>
            <svg
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8">
                <rect x="3" y="3" width="18" height="18" rx="3" fill="url(#logo-gradient)" />
                <path
                    d="M12 8V16M8 12H16"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                />
                <defs>
                    <linearGradient
                        id="logo-gradient"
                        x1="12"
                        y1="3"
                        x2="12"
                        y2="21"
                        gradientUnits="userSpaceOnUse">
                        <stop stopColor="#2563eb" />
                        <stop offset="1" stopColor="#1e40af" />
                    </linearGradient>
                </defs>
            </svg>
            <span className="text-xl font-bold text-gray-900">TradeOS</span>
        </div>
    )
}
