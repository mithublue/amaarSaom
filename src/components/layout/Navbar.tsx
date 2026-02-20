'use client';

import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import LanguageSwitcher from './LanguageSwitcher';
import UserMenu from './UserMenu';

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
    const pathname = usePathname();
    const router = useRouter();

    // Show back button on any page that's not the home page
    const isHome = pathname === `/${locale}` || pathname === '/' || pathname === `/${locale}/`;

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-primary-950/80 backdrop-blur-md border-b border-white/10 shadow-glass">
            <div className="container mx-auto px-4 py-3 flex justify-between items-center">

                {/* Left: Back button (inner pages) OR Logo (home) */}
                <div className="flex items-center gap-3 shrink-0">
                    {!isHome && (
                        <button
                            onClick={() => router.back()}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-gray-400 hover:text-white transition-all text-sm"
                            title="Go back"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                            </svg>
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

                {/* Actions Section */}
                <div className="flex items-center gap-2 md:gap-4 shrink-0">
                    <NotificationBell />
                    <LanguageSwitcher />
                    <UserMenu session={session} locale={locale} />
                </div>
            </div>
        </nav>
    );
}
