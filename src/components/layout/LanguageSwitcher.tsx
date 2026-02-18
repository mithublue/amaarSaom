'use client';

import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/routing';
import { ChangeEvent, useTransition } from 'react';

export default function LanguageSwitcher() {
    const t = useTranslations('LanguageSwitcher');
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();
    const [isPending, startTransition] = useTransition();

    const onSelectChange = (e: ChangeEvent<HTMLSelectElement>) => {
        const nextLocale = e.target.value;
        startTransition(() => {
            router.replace(pathname, { locale: nextLocale });
        });
    };

    return (
        <div className="relative inline-block text-left">
            <select
                defaultValue={locale}
                onChange={onSelectChange}
                disabled={isPending}
                className="appearance-none bg-white/10 text-white border border-white/20 hover:border-white/40 px-4 py-2 pr-8 rounded-lg shadow leading-tight focus:outline-none focus:bg-white/20 focus:border-white/50 transition-colors cursor-pointer"
            >
                <option value="en" className="text-black">🇺🇸 English</option>
                <option value="bn" className="text-black">🇧🇩 Bangla</option>
                <option value="ar" className="text-black">🇸🇦 Arabic</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-white">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                </svg>
            </div>
        </div>
    );
}
