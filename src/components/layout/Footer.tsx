import { useTranslations } from 'next-intl';

export default function Footer({ language }: { language?: string }) {
    const t = useTranslations('Footer');

    return (
        <footer className="mt-16 py-8 text-center border-t border-white/5 bg-primary-950/30 backdrop-blur-sm relative z-10">
            <div className="container mx-auto px-4">
                <p className="text-primary-300 font-medium text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
                    {t('disclaimer')}
                </p>
                <div className="mt-4 text-primary-400/60 text-xs text-balance font-sans">
                    © {new Date().getFullYear()} {t('copyright')} • Built with <span className="text-red-400">❤</span> for the Ummah
                </div>
            </div>
        </footer>
    );
}
