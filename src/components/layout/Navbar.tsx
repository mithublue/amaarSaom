import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import LanguageSwitcher from './LanguageSwitcher';

interface NavbarProps {
    session: any; // Type accurately if possible, or use 'any' for now to match current usage
    locale: string;
}

export default function Navbar({ session, locale }: NavbarProps) {
    const t = useTranslations('HomePage'); // or a specific Navbar namespace if created

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-primary-950/80 backdrop-blur-md border-b border-white/10 shadow-glass">
            <div className="container mx-auto px-4 py-3 flex flex-col md:flex-row justify-between items-center gap-4">
                {/* Logo Section */}
                <Link href="/" className="flex items-center gap-3 group">
                    <div className="w-10 h-10 rounded-full bg-linear-to-br from-accent-500 to-accent-600 flex items-center justify-center shadow-gold-glow group-hover:scale-110 transition-transform">
                        <span className="text-xl">🌙</span>
                    </div>
                    <h1 className="text-xl font-heading font-bold text-transparent bg-clip-text bg-linear-to-r from-white to-primary-200 tracking-wide">
                        {t('title')}
                    </h1>
                </Link>

                {/* Actions Section */}
                <div className="flex flex-wrap justify-center items-center gap-3 md:gap-4">
                    <LanguageSwitcher />

                    <span className="text-secondary text-sm md:text-base font-medium font-sans">
                        {session?.user?.name || t('guest')}
                    </span>

                    <Link
                        href="/profile"
                        className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-primary-100 hover:bg-white/10 hover:text-white hover:border-accent-500/50 transition-all duration-300 flex items-center gap-2 text-sm md:text-base font-medium shadow-sm hover:shadow-glow"
                    >
                        <span>👤</span> {t('profile')}
                    </Link>

                    {session && (
                        <a
                            href={`/api/auth/signout?callbackUrl=/${locale}`}
                            className="px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-200 hover:bg-red-500/20 hover:text-red-100 transition-all duration-300 text-sm md:text-base font-medium"
                        >
                            {t('signOut')}
                        </a>
                    )}
                </div>
            </div>
        </nav>
    );
}
