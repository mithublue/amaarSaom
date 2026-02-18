import { useTranslations } from 'next-intl';

export default function Footer({ language }: { language?: string }) {
    const t = useTranslations('Footer');

    return (
        <footer className="mt-16 py-8 text-center border-t border-white/10 bg-black/20 backdrop-blur-sm">
            <div className="container mx-auto px-4">
                <p className="text-primary-200 font-medium text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
                    {t('disclaimer')}
                </p>
                <div className="mt-4 text-primary-400 text-xs text-balance">
                    © {new Date().getFullYear()} {t('copyright')}
                </div>
            </div>
        </footer>
    );
}
