'use client';

import { useState, useRef, useEffect } from 'react';
import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { User, LogOut, ChevronDown } from 'lucide-react';

interface UserMenuProps {
    session: any;
    locale: string;
}

export default function UserMenu({ session, locale }: UserMenuProps) {
    const t = useTranslations('HomePage'); // Using existing namespace
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    if (!session) {
        return (
            <Link
                href="/auth/signin"
                className="px-4 py-2 rounded-xl bg-accent-600 text-white font-medium hover:bg-accent-500 transition-colors shadow-lg shadow-accent-600/20"
            >
                {t('signIn') || 'Sign In'}
            </Link>
        );
    }

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-2 py-1.5 md:px-3 md:py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-primary-100 transition-all duration-200 shadow-sm"
            >
                <div className="w-8 h-8 rounded-full bg-linear-to-br from-accent-500 to-accent-600 flex items-center justify-center text-white shadow-inner">
                    {session.user?.image ? (
                        <img
                            src={session.user.image}
                            alt={session.user.name || 'User'}
                            className="w-full h-full rounded-full object-cover"
                        />
                    ) : (
                        <span className="text-sm font-bold">
                            {session.user?.name?.charAt(0).toUpperCase() || 'U'}
                        </span>
                    )}
                </div>

                <span className="hidden md:block text-sm font-medium max-w-[100px] truncate">
                    {session.user?.name || 'User'}
                </span>

                <ChevronDown className={`w-4 h-4 text-primary-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-primary-900 border border-white/10 rounded-xl shadow-glass overflow-hidden z-50 backdrop-blur-xl animate-fade-in origin-top-right">
                    <div className="p-4 border-b border-white/5">
                        <p className="text-sm font-bold text-white truncate">{session.user?.name}</p>
                        <p className="text-xs text-primary-400 truncate">{session.user?.email}</p>
                    </div>

                    <div className="p-1">
                        <Link
                            href="/profile"
                            onClick={() => setIsOpen(false)}
                            className="flex items-center gap-3 px-4 py-3 text-sm text-primary-200 hover:bg-white/5 hover:text-white rounded-lg transition-colors"
                        >
                            <User className="w-4 h-4" />
                            {t('profile')}
                        </Link>

                        <a
                            href={`/api/auth/signout?callbackUrl=/${locale}`}
                            className="flex items-center gap-3 px-4 py-3 text-sm text-red-300 hover:bg-red-500/10 hover:text-red-200 rounded-lg transition-colors"
                        >
                            <LogOut className="w-4 h-4" />
                            {t('signOut')}
                        </a>
                    </div>
                </div>
            )}
        </div>
    );
}
