import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import LanguageSwitcher from './LanguageSwitcher';
import UserMenu from './UserMenu';
import NotificationBell from '@/components/notifications/NotificationBell';

interface NavbarProps {
    session: any;
    locale: string;
}

export default function Navbar({ session, locale }: NavbarProps) {
    const t = useTranslations('HomePage');

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-primary-950/80 backdrop-blur-md border-b border-white/10 shadow-glass">
            <div className="container mx-auto px-4 py-3 flex justify-between items-center">
                {/* Logo Section */}
                <Link href="/" className="flex items-center gap-2 md:gap-3 group shrink-0">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-linear-to-br from-accent-500 to-accent-600 flex items-center justify-center shadow-gold-glow group-hover:scale-110 transition-transform">
                        <span className="text-lg md:text-xl">🌙</span>
                    </div>
                    <h1 className="text-lg md:text-xl font-heading font-bold text-transparent bg-clip-text bg-linear-to-r from-white to-primary-200 tracking-wide hidden xs:block">
                        {t('title')}
                    </h1>
                </Link>

                {/* Actions Section - Single Line Alignment */}
                <div className="flex items-center gap-2 md:gap-4 shrink-0">
                    {session?.user && <NotificationBell />}
                    <LanguageSwitcher />
                    <UserMenu session={session} locale={locale} />
                </div>
            </div>
        </nav>
    );
}
