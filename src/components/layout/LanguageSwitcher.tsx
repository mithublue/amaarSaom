'use client';

import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/routing';
import { ChangeEvent, useTransition, useState, useRef, useEffect } from 'react';

export default function LanguageSwitcher() {
    const t = useTranslations('LanguageSwitcher');
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();
    const [isPending, startTransition] = useTransition();

    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const languages = [
        { code: 'en', label: 'English', flag: 'us' },
        { code: 'bn', label: 'Bangla', flag: 'bd' },
        { code: 'ar', label: 'Arabic', flag: 'sa' },
    ];

    const currentLang = languages.find((lang) => lang.code === locale);
    const currentFlag = currentLang?.flag || 'us'; // Default to US flag if not found
    const currentLangLabel = currentLang?.label || 'English'; // Default to English if not found

    const handleLanguageChange = (nextLocale: string) => {
        startTransition(() => {
            router.replace(pathname, { locale: nextLocale });
            setIsOpen(false); // Close dropdown after selection
        });
    };

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
    }, [dropdownRef]);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-primary-100 transition-all duration-200 shadow-sm"
            >
                <span className={`fi fi-${currentFlag} rounded-sm shadow-sm opacity-90`} />
                <span className="text-sm font-medium">{currentLangLabel}</span>
                <span className="text-xs opacity-60">▼</span>
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-primary-900 border border-white/10 rounded-xl shadow-glass overflow-hidden z-50 backdrop-blur-xl animate-fade-in">
                    <div className="py-1">
                        {languages.map((lang) => (
                            <button
                                key={lang.code}
                                onClick={() => handleLanguageChange(lang.code)}
                                disabled={isPending}
                                className={`w-full flex items-center gap-3 px-4 py-3 text-sm text-left transition-colors
                                    ${locale === lang.code
                                        ? 'bg-primary-800 text-accent-400 font-semibold'
                                        : 'text-primary-200 hover:bg-white/5 hover:text-white'
                                    }
                                `}
                            >
                                <span className={`fi fi-${lang.flag} rounded-sm shadow-sm`} />
                                {lang.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
