'use client';

import { Facebook, Twitter, Send, Share2 } from 'lucide-react';
import { useEffect, useState } from 'react';

interface TafseerShareButtonsProps {
    surahId: string;
    ayahId: string;
    surahName: string;
    tafseerText: string;
}

export default function TafseerShareButtons({ surahId, ayahId, surahName, tafseerText }: TafseerShareButtonsProps) {
    const [origin, setOrigin] = useState('');

    useEffect(() => {
        setOrigin(window.location.origin);
    }, []);

    const handleShare = (platform: 'facebook' | 'whatsapp' | 'twitter') => {
        if (!origin) return;

        // Current page URL (which is the Tafseer drawer URL)
        const url = window.location.href;

        // Strip out HTML tags for clean text sharing
        const cleanTafseerText = tafseerText ? tafseerText.replace(/<[^>]*>?/gm, '') : '';
        let snippet = cleanTafseerText;
        if (snippet.length > 300) {
            snippet = snippet.substring(0, 300) + '...';
        }

        const text = `Read Tafseer for Surah ${surahName}, Ayah ${ayahId} on Nuzul\n\n${snippet}\n`;

        let shareUrl = '';
        if (platform === 'facebook') {
            shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        } else if (platform === 'whatsapp') {
            shareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text + '\n' + url)}`;
        } else if (platform === 'twitter') {
            let twText = text;
            if (twText.length > 200) twText = twText.substring(0, 197) + '...';
            shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(twText)}&url=${encodeURIComponent(url)}`;
        }

        window.open(shareUrl, '_blank', 'width=600,height=400');
    };

    const copyLink = () => {
        navigator.clipboard.writeText(window.location.href);
        alert('Tafseer link copied to clipboard!');
    };

    return (
        <div className="flex items-center gap-2 mr-4">
            <button
                onClick={() => handleShare('whatsapp')}
                title="Share on WhatsApp"
                className="w-8 h-8 flex items-center justify-center rounded-full bg-primary-800 text-[#25D366] hover:bg-[#25D366]/20 transition-all"
            >
                <Send className="w-4 h-4" />
            </button>
            <button
                onClick={() => handleShare('facebook')}
                title="Share on Facebook"
                className="w-8 h-8 flex items-center justify-center rounded-full bg-primary-800 text-[#1877F2] hover:bg-[#1877F2]/20 transition-all"
            >
                <Facebook className="w-4 h-4" />
            </button>
            <button
                onClick={() => handleShare('twitter')}
                title="Share on X"
                className="w-8 h-8 flex items-center justify-center rounded-full bg-primary-800 text-white hover:bg-white/10 transition-all"
            >
                <Twitter className="w-4 h-4" />
            </button>
            <button
                onClick={copyLink}
                title="Copy Link"
                className="w-8 h-8 flex items-center justify-center rounded-full bg-primary-800 text-primary-200 hover:bg-white/10 hover:text-white transition-all"
            >
                <Share2 className="w-4 h-4" />
            </button>
        </div>
    );
}
