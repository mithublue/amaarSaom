'use client';

import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import LanguageSwitcher from './LanguageSwitcher';
import UserMenu from './UserMenu';
import {
    Home,
    BookOpen,
    Sparkles,
    Trophy,
    User,
    ChevronLeft
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

    // Show back button on any page that's not the home page
    const isHome = pathname === `/${locale}` || pathname === '/' || pathname === `/${locale}/`;

    const navItems = [
        { name: nt('home'), href: '/', icon: Home },
        { name: nt('quran'), href: '/quran', icon: BookOpen },
        { name: nt('good-deeds'), href: '/good-deeds', icon: Sparkles },
        { name: nt('leaderboard'), href: '/leaderboard', icon: Trophy },
        { name: nt('profile'), href: '/profile', icon: User },
    ];

    const isActive = (path: string) => {
        const fullPath = path === '/' ? `/${locale}` : `/${locale}${path}`;
        return pathname === fullPath || (path !== '/' && pathname.startsWith(fullPath));
    };

    return (
        <>
            {/* Top Navbar - Fixed */}
            <nav className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-primary-950/80 backdrop-blur-md border-b border-white/10 shadow-glass">
                <div className="container mx-auto px-4 py-3 flex justify-between items-center h-16">

                    {/* Left: Back button (inner pages) OR Logo (home) */}
                    <div className="flex items-center gap-3 shrink-0">
                        {!isHome && (
                            <button
                                onClick={() => router.back()}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-gray-400 hover:text-white transition-all text-sm"
                                title="Go back"
                            >
                                <ChevronLeft className="w-4 h-4" />
                                <span className="hidden sm:inline">Back</span>
                            </button>
                        )}

                        {/* Logo + Brand Name — always visible */}
                        <Link href="/" className="flex items-center gap-2 group shrink-0">
                            <div className="w-8 h-8 rounded-full bg-linear-to-br from-accent-500 to-accent-600 flex items-center justify-center shadow-gold-glow group-hover:scale-110 transition-transform">
                                <span className="text-lg">🌙</span>
                            </div>
                            <span className="font-bold text-white tracking-wide text-lg">
                                Nuzul
                            </span>
                        </Link>
                    </div>

                    {/* Desktop Navigation Links - Hidden on Mobile */}
                    <div className="hidden md:flex items-center gap-1">
                        {navItems.map((item) => {
                            const active = isActive(item.href);
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${active
                                            ? 'text-accent-400 bg-accent-400/10'
                                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                                        }`}
                                >
                                    {item.name}
                                </Link>
                            );
                        })}
                    </div>

                    {/* Actions Section */}
                    <div className="flex items-center gap-2 md:gap-4 shrink-0">
                        <NotificationBell />
                        <LanguageSwitcher />
                        <div className="hidden md:block">
                            <UserMenu session={session} locale={locale} />
                        </div>
                    </div>
                </div>
            </nav>

            {/* Mobile Bottom Navigation - Hidden on Desktop */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-primary-950/90 backdrop-blur-lg border-t border-white/10 pb-safe-area-inset-bottom shadow-[0_-10px_20px_rgba(0,0,0,0.5)]">
                <div className="flex justify-around items-center h-16">
                    {navItems.map((item) => {
                        const active = isActive(item.href);
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex flex-col items-center justify-center flex-1 h-full transition-all ${active ? 'text-accent-400' : 'text-gray-400 hover:text-gray-200'
                                    }`}
                            >
                                <Icon className={`w-5 h-5 mb-1 ${active ? 'scale-110' : ''} transition-transform`} />
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
