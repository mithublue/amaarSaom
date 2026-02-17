'use client';

import { useSession } from 'next-auth/react';

const disclaimers = {
    en: "This point system is only to encourage you. The real reward is known and given by Allah alone.",
    bn: "এই পয়েন্ট সিস্টেমটি শুধুমাত্র আপনাকে উৎসাহিত করার জন্য। প্রকৃত সওয়াব বা নেকি একমাত্র আল্লাহ তায়ালাই জানেন এবং দেবেন।",
    ar: "نظام النقاط هذا هو فقط لتشجيعك. الأجر الحقيقي عند الله وحده."
};

type Language = 'en' | 'bn' | 'ar';

export default function Footer({ language = 'en' }: { language?: string }) {
    // In a real app, we might check session here if not passed as prop, 
    // but accepting it as prop makes it flexible for Server Components to pass it down.

    // Fallback to 'en' if invalid code
    const currentLang = (['en', 'bn', 'ar'].includes(language) ? language : 'en') as Language;

    return (
        <footer className="mt-16 py-8 text-center border-t border-white/10 bg-black/20 backdrop-blur-sm">
            <div className="container mx-auto px-4">
                <p className="text-primary-200 font-medium text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
                    {disclaimers[currentLang]}
                </p>
                <div className="mt-4 text-primary-400 text-xs">
                    © {new Date().getFullYear()} Ramadan Companion. Built for the Ummah.
                </div>
            </div>
        </footer>
    );
}
