'use client';

import { useState, useEffect } from 'react';
import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import LanguageSwitcher from './LanguageSwitcher';
import UserMenu from './UserMenu';
import LordIcon from '@/components/ui/LordIcon';
import {
    Home,
    BookOpen,
    Sparkles,
    Trophy,
    User,
    ChevronLeft,
    Menu,
    X,
    Clock,
    Moon,
    Scroll,
    Hand,
    Coins,
    Brain
} from 'lucide-react';

const NotificationBell = dynamic(
    () => import('@/components/notifications/NotificationBell'),
    { ssr: false }
);

interface NavbarProps {
    session: any;
    locale: string;
}

export default function Navbar({ session, locale }: NavbarProps) {
    const t = useTranslations('HomePage');
    const nt = useTranslations('Navigation');
    const pathname = usePathname();
    const router = useRouter();
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    // Show back button on any page that's not the home page
    const isHome = pathname === `/${locale}` || pathname === '/' || pathname === `/${locale}/`;

    // Bottom Navigation Items (Mobile)
    const bottomNavItems = [
        { name: nt('home'), href: '/', icon: Home, lordIcon: 'home' },
        { name: nt('good-deeds'), href: '/good-deeds', icon: Sparkles },
        { name: nt('leaderboard'), href: '/leaderboard', icon: Trophy },
        { name: nt('duas'), href: '/duas', icon: Hand },
        { name: nt('quiz'), href: '/quiz', icon: Brain },
    ];

    // Drawer Items (Mobile Sidebar)
    const drawerItems = [
        { name: t('features.prayerTimes.title'), href: '/prayer-times', icon: Clock },
        { name: t('features.iftarSehri.title'), href: '/iftar-sehri', icon: Moon },
        { name: t('features.goodDeeds.title'), href: '/good-deeds', icon: Sparkles },
        { name: t('features.quran.title'), href: '/quran', icon: BookOpen },
        { name: t('features.hadith.title'), href: '/hadith', icon: Scroll },
        { name: t('features.duas.title'), href: '/duas', icon: Hand },
        { name: t('features.leaderboard.title'), href: '/leaderboard', icon: Trophy },
        { name: t('features.quiz.title'), href: '/quiz', icon: Brain },
        { name: t('features.zakat.title'), href: 'https://assunnahfoundation.org/zakat-calculator', icon: Coins },
    ];

    // Desktop Navigation Items
    const desktopNavItems = [
        { name: nt('home'), href: '/', icon: Home, lordIcon: 'home' },
        { name: nt('quran'), href: '/quran', icon: BookOpen },
        { name: nt('good-deeds'), href: '/good-deeds', icon: Sparkles },
        { name: nt('leaderboard'), href: '/leaderboard', icon: Trophy },
        ...(session ? [{ name: nt('profile'), href: '/profile', icon: User }] : []),
    ];

    const isActive = (path: string) => {
        const fullPath = path === '/' ? `/${locale}` : `/${locale}${path}`;
        return pathname === fullPath || (path !== '/' && pathname.startsWith(fullPath));
    };

    // Close drawer when pathname changes
    useEffect(() => {
        setIsDrawerOpen(false);
    }, [pathname]);

    // Prevent scroll when drawer is open
    useEffect(() => {
        if (isDrawerOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
    }, [isDrawerOpen]);

    return (
        <>
            {/* Top Navbar - Fixed */}
            <nav className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-primary-950/80 backdrop-blur-md border-b border-white/10 shadow-glass">
                <div className="container mx-auto px-4 py-3 flex justify-between items-center h-16">

                    {/* Left: Menu Toggle (mobile) + Logo */}
                    <div className="flex items-center gap-2 md:gap-3 shrink-0">
                        <button
                            className="md:hidden p-2 -ml-2 text-gray-400 hover:text-white transition-colors"
                            onClick={() => setIsDrawerOpen(true)}
                        >
                            <Menu className="w-6 h-6" />
                        </button>

                        {!isHome && (
                            <button
                                onClick={() => router.back()}
                                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-gray-400 hover:text-white transition-all text-sm"
                                title="Go back"
                            >
                                <ChevronLeft className="w-4 h-4" />
                                <span>Back</span>
                            </button>
                        )}

                        {/* Logo + Brand Name — always visible */}
                        <Link href="/" className="flex items-center gap-2 group shrink-0">
                            <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-linear-to-br from-accent-500 to-accent-600 flex items-center justify-center shadow-gold-glow group-hover:scale-110 transition-transform">
                                <span className="text-base md:text-lg">🌙</span>
                            </div>
                            <span className="font-bold text-white tracking-wide text-base md:text-lg">
                                Nuzul
                            </span>
                        </Link>
                    </div>

                    {/* Desktop Navigation Links - Hidden on Mobile */}
                    <div className="hidden md:flex items-center gap-2 lg:gap-4 text-xs lg:text-sm">
                        {desktopNavItems.map((item) => {
                            const active = isActive(item.href);
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex flex-col items-center justify-center min-w-[70px] px-2 py-1 transition-all ${active
                                        ? 'text-accent-400 scale-105 drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]'
                                        : 'text-gray-400 hover:text-white hover:scale-105'
                                        }`}
                                >
                                    {item.lordIcon ? (
                                        <div className="mb-1.5 flex items-center justify-center h-5">
                                            <LordIcon src={item.lordIcon} size={24} colors={active ? "primary:#eab308,secondary:#ffffff" : "primary:#9ca3af,secondary:#ffffff"} trigger="hover" />
                                        </div>
                                    ) : (
                                        <Icon className={`w-5 h-5 mb-1.5 ${active ? 'animate-pulse' : ''}`} />
                                    )}
                                    <span className="font-semibold tracking-wide text-[11px] lg:text-xs">{item.name}</span>
                                </Link>
                            );
                        })}
                    </div>

                    {/* Actions Section */}
                    <div className="flex items-center gap-1 md:gap-4 shrink-0">
                        <NotificationBell />
                        <LanguageSwitcher />
                        <UserMenu session={session} locale={locale} />
                    </div>
                </div>
            </nav>

            {/* Mobile Drawer Overlay */}
            {isDrawerOpen && (
                <div
                    className="md:hidden fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in"
                    onClick={() => setIsDrawerOpen(false)}
                />
            )}

            {/* Mobile Left Drawer */}
            <div className={`md:hidden fixed top-0 left-0 bottom-0 z-[101] w-[280px] bg-primary-950 border-r border-white/10 shadow-2xl transition-transform duration-300 ease-in-out ${isDrawerOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="flex flex-col h-full bg-[url('/pattern.png')] bg-repeat opacity-100">
                    <div className="p-4 border-b border-white/10 flex justify-between items-center bg-primary-900/50 backdrop-blur-md">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-accent-600 flex items-center justify-center">
                                <span className="text-lg">🌙</span>
                            </div>
                            <span className="font-bold text-white tracking-wide text-xl">Nuzul</span>
                        </div>
                        <button
                            className="p-2 text-gray-400 hover:text-white transition-colors"
                            onClick={() => setIsDrawerOpen(false)}
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                        {drawerItems.map((item) => {
                            const active = isActive(item.href);
                            const Icon = item.icon;
                            const isExternal = item.href.startsWith('http');
                            const Comp = isExternal ? 'a' : Link;
                            const props = isExternal
                                ? { href: item.href, target: "_blank", rel: "noopener noreferrer" } as any
                                : { href: item.href };

                            return (
                                <Comp
                                    key={item.href}
                                    {...props}
                                    className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all ${active
                                        ? 'bg-accent-600/20 text-accent-400 border border-accent-600/20'
                                        : 'text-gray-300 hover:bg-white/5 border border-transparent'
                                        }`}
                                >
                                    <div className={`p-2 rounded-xl ${active ? 'bg-accent-600/10' : 'bg-primary-900'}`}>
                                        <Icon className="w-5 h-5" />
                                    </div>
                                    <span className="font-medium">{item.name}</span>
                                </Comp>
                            );
                        })}
                    </div>

                    {session && (
                        <div className="p-4 border-t border-white/10 bg-primary-900/30">
                            <Link
                                href="/profile"
                                className="flex items-center gap-4 px-4 py-3 rounded-2xl text-gray-400 hover:text-white transition-all"
                            >
                                <User className="w-5 h-5" />
                                <span className="font-medium text-sm">{nt('profile')}</span>
                            </Link>
                        </div>
                    )}
                </div>
            </div>

            {/* Mobile Bottom Navigation - Hidden on Desktop */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-primary-950/90 backdrop-blur-lg border-t border-white/10 pb-safe-area-inset-bottom shadow-[0_-10px_20px_rgba(0,0,0,0.5)]">
                <div className="flex justify-around items-center h-16">
                    {bottomNavItems.map((item) => {
                        const active = isActive(item.href);
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex flex-col items-center justify-center flex-1 h-full transition-all relative ${active ? 'text-accent-400' : 'text-gray-400 hover:text-gray-200'
                                    }`}
                            >
                                {item.lordIcon ? (
                                    <div className={`mb-1 flex items-center justify-center h-5 ${active ? 'scale-110' : ''} transition-transform`}>
                                        <LordIcon src={item.lordIcon} size={24} colors={active ? "primary:#eab308,secondary:#ffffff" : "primary:#9ca3af,secondary:#ffffff"} trigger="hover" />
                                    </div>
                                ) : (
                                    <Icon className={`w-5 h-5 mb-1 ${active ? 'scale-110' : ''} transition-transform`} />
                                )}
                                <span className="text-[10px] font-medium tracking-tight">
                                    {item.name}
                                </span>
                                {active && (
                                    <div className="absolute bottom-1 w-1 h-1 rounded-full bg-accent-400 shadow-gold-glow animate-pulse" />
                                )}
                            </Link>
                        );
                    })}
                </div>
            </nav>
        </>
    );
}
