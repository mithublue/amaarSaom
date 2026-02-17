'use client';

import { useState } from 'react';
import { toast } from 'sonner';

interface HadithClientProps {
    initialHadith?: {
        text: string;
        source: string;
    }
}

export default function HadithClient({ initialHadith }: HadithClientProps) {
    // Track which platforms have been used to share to prevent duplicate points
    const [sharedPlatforms, setSharedPlatforms] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(false);

    const hadith = initialHadith || {
        text: "The best of you are those who learn the Quran and teach it.",
        source: "Prophet Muhammad ﷺ (Sahih Bukhari)"
    };

    const handleShare = async (platform: 'twitter' | 'facebook' | 'email') => {
        const textToShare = `"${hadith.text}" — ${hadith.source}\n\nRead more on Ramadan Companion App! 🌙`;
        const url = window.location.href;

        let shareUrl = '';
        switch (platform) {
            case 'twitter':
                shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(textToShare)}&url=${encodeURIComponent(url)}`;
                break;
            case 'facebook':
                shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(textToShare)}`;
                break;
            case 'email':
                shareUrl = `mailto:?subject=Hadith of the Day&body=${encodeURIComponent(textToShare)}`;
                break;
        }

        // Open share window
        window.open(shareUrl, '_blank', 'width=600,height=400');

        // Award Points (once per platform)
        if (!sharedPlatforms.has(platform)) {
            try {
                setLoading(true);
                const res = await fetch('/api/deeds/complete', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        customDeedName: `Shared Daily Hadith (${platform})`,
                        points: 10,
                        date: new Date().toISOString()
                    })
                });

                const data = await res.json();
                if (data.success) {
                    setSharedPlatforms(prev => new Set(prev).add(platform));
                    toast.success(`You earned 10 points for sharing on ${platform}! 🌟`);
                }
            } catch (error) {
                console.error('Error awarding points:', error);
            } finally {
                setLoading(false);
            }
        }
    };

    return (
        <div className="bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 p-8 mb-6">
            <div className="text-center mb-6">
                <span className="text-5xl block mb-4">📖</span>
                <h2 className="text-2xl font-bold text-white mb-2">Hadith of the Day</h2>
                <p className="text-primary-200 text-sm">Day {new Date().getDate()} of Ramadan</p>
            </div>

            <div className="bg-white/5 rounded-2xl p-6 mb-8 group relative overflow-hidden transition-all hover:bg-white/10">
                <div className="absolute -right-10 -top-10 text-9xl opacity-5 text-white">❝</div>
                <p className="text-white text-xl md:text-2xl italic leading-relaxed text-center mb-6 font-serif relative z-10">
                    "{hadith.text}"
                </p>
                <div className="w-16 h-1 bg-accent/50 mx-auto mb-4 rounded-full"></div>
                <p className="text-primary-200 text-sm md:text-base text-center font-semibold tracking-wide uppercase">
                    — {hadith.source}
                </p>
            </div>

            <div className="flex flex-col items-center gap-4">
                <div className="text-center">
                    <p className="text-primary-300 text-sm mb-2">Share this beautiful message:</p>
                    <p className="text-accent text-xs font-semibold mb-4 bg-accent/10 px-3 py-1 rounded-full inline-block">
                        🎁 Reward: 10 Points (once per platform)
                    </p>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={() => handleShare('twitter')}
                        className={`p-3 rounded-full transition-all text-white border border-white/10 ${sharedPlatforms.has('twitter') ? 'bg-green-600/50' : 'bg-black/30 hover:bg-[#1DA1F2] hover:scale-110'}`}
                        title="Share on Twitter"
                        disabled={sharedPlatforms.has('twitter')}
                    >
                        {sharedPlatforms.has('twitter') ? '✅' : <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" /></svg>}
                    </button>
                    <button
                        onClick={() => handleShare('facebook')}
                        className={`p-3 rounded-full transition-all text-white border border-white/10 ${sharedPlatforms.has('facebook') ? 'bg-green-600/50' : 'bg-black/30 hover:bg-[#4267B2] hover:scale-110'}`}
                        title="Share on Facebook"
                        disabled={sharedPlatforms.has('facebook')}
                    >
                        {sharedPlatforms.has('facebook') ? '✅' : <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>}
                    </button>
                    <button
                        onClick={() => handleShare('email')}
                        className={`p-3 rounded-full transition-all text-white border border-white/10 ${sharedPlatforms.has('email') ? 'bg-green-600/50' : 'bg-black/30 hover:bg-green-600 hover:scale-110'}`}
                        title="Share via Email"
                        disabled={sharedPlatforms.has('email')}
                    >
                        {sharedPlatforms.has('email') ? '✅' : <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>}
                    </button>
                </div>
            </div>
        </div>
    );
}
