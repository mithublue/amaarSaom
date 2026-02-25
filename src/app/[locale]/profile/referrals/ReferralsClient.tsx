'use client';

import { useState } from 'react';
import {
    Users,
    Gift,
    Copy,
    Check,
    TrendingUp,
    Calendar,
    ArrowLeft,
    Award
} from 'lucide-react';
import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';

interface ReferralsClientProps {
    referralCode: string;
    stats: {
        totalReferrals: number;
        totalPoints: number;
        activeToday: number;
        activeThisWeek: number;
        activeThisMonth: number;
    };
    referrals: {
        id: number;
        name: string;
        image: string | null;
        joinedAt: Date;
        totalEarnedForReferrer: number;
        lastActive: Date | null;
    }[];
    locale: string;
}

export default function ReferralsClient({ referralCode, stats, referrals, locale }: ReferralsClientProps) {
    const t = useTranslations('Referrals');
    const [copied, setCopied] = useState(false);
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const referralLink = `${baseUrl}/${locale}/auth/register?ref=${referralCode}`;

    const copyToClipboard = () => {
        if (!referralCode) return;
        navigator.clipboard.writeText(referralLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const isActiveToday = (lastActive: Date | null) => {
        if (!lastActive) return false;
        return new Date(lastActive) > new Date(Date.now() - 24 * 60 * 60 * 1000);
    };

    return (
        <div className="min-h-screen pb-20">
            <div className="container mx-auto px-4 py-8 max-w-5xl">

                {/* Back Button - now goes to /profile */}
                <Link
                    href="/profile"
                    className="inline-flex items-center gap-2 text-emerald-300 hover:text-emerald-200 font-medium mb-8 group transition-all"
                >
                    <div className="p-2 rounded-full glass-card border border-emerald-500/20 group-hover:scale-110 transition-transform">
                        <ArrowLeft size={16} />
                    </div>
                    {t('backToDashboard')}
                </Link>

                {/* Hero / Header Card */}
                <div className="relative overflow-hidden glass-panel rounded-3xl p-8 md:p-10 mb-8 border border-emerald-500/20 shadow-2xl">
                    <div className="absolute -top-16 -right-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-yellow-500/5 rounded-full blur-2xl pointer-events-none" />

                    <div className="relative flex flex-col lg:flex-row items-center gap-10">
                        {/* Left: text */}
                        <div className="flex-1 text-center lg:text-left">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-yellow-500/30 bg-yellow-500/10 text-yellow-400 text-xs font-bold tracking-widest mb-5">
                                <Award size={14} />
                                {t('badge')}
                            </div>
                            <h1 className="text-4xl md:text-5xl font-black text-white leading-tight mb-3">
                                {t('title')}<br />
                                <span className="text-yellow-400">{t('titleHighlight')}</span>
                            </h1>
                            <p
                                className="text-emerald-200 text-base md:text-lg max-w-md leading-relaxed"
                                dangerouslySetInnerHTML={{ __html: t('subtitle') }}
                            />
                        </div>

                        {/* Right: code card */}
                        <div className="w-full lg:w-auto shrink-0">
                            <div className="glass-card rounded-3xl p-7 w-full lg:w-[320px] border border-emerald-500/20">
                                <p className="text-emerald-400 font-bold text-xs uppercase tracking-widest mb-4 text-center">
                                    {t('yourCode')}
                                </p>

                                <div className="flex items-center justify-between bg-emerald-950/60 border border-emerald-500/30 rounded-2xl px-5 py-4 mb-5 gap-3">
                                    <span className="text-2xl font-black text-emerald-300 tracking-widest font-mono">
                                        {referralCode || '—'}
                                    </span>
                                    <button
                                        onClick={copyToClipboard}
                                        disabled={!referralCode}
                                        className="text-emerald-400 hover:text-yellow-400 transition-colors disabled:opacity-40"
                                        title="Copy code"
                                    >
                                        {copied ? <Check size={20} className="text-green-400" /> : <Copy size={20} />}
                                    </button>
                                </div>

                                <button
                                    onClick={copyToClipboard}
                                    disabled={!referralCode}
                                    className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/40 active:scale-[0.98]"
                                >
                                    {copied
                                        ? <><Check size={18} /> {t('linkCopied')}</>
                                        : <><Copy size={18} /> {t('copyLink')}</>
                                    }
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <StatCard icon={<Users size={20} className="text-blue-400" />} label={t('statTotalReferred')} value={stats.totalReferrals} suffix={t('statTotalReferredSuffix')} />
                    <StatCard icon={<Gift size={20} className="text-yellow-400" />} label={t('statPointsEarned')} value={stats.totalPoints} suffix={t('statPointsEarnedSuffix')} />
                    <StatCard icon={<TrendingUp size={20} className="text-green-400" />} label={t('statActiveToday')} value={stats.activeToday} suffix={t('statActiveTodaySuffix')} />
                    <StatCard icon={<Calendar size={20} className="text-purple-400" />} label={t('statWeeklyActive')} value={stats.activeThisWeek} suffix={t('statWeeklyActiveSuffix')} />
                </div>

                {/* Referral List */}
                <div className="glass-panel rounded-3xl border border-emerald-500/20 overflow-hidden">
                    <div className="flex items-center justify-between px-8 py-5 border-b border-emerald-500/10">
                        <h2 className="text-lg font-black text-white flex items-center gap-3">
                            <Users size={22} className="text-emerald-400" />
                            {t('myReferrals')}
                        </h2>
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/20">
                            {referrals.length} {t('joined')}
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-emerald-500/10">
                                    <th className="px-8 py-4 text-left text-xs font-bold text-emerald-500 uppercase tracking-widest">{t('colUser')}</th>
                                    <th className="px-8 py-4 text-left text-xs font-bold text-emerald-500 uppercase tracking-widest">{t('colJoinedDate')}</th>
                                    <th className="px-8 py-4 text-center text-xs font-bold text-emerald-500 uppercase tracking-widest">{t('colPointsShared')}</th>
                                    <th className="px-8 py-4 text-right text-xs font-bold text-emerald-500 uppercase tracking-widest">{t('colStatus')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-emerald-500/10">
                                {referrals.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-8 py-20 text-center">
                                            <div className="flex flex-col items-center gap-4">
                                                <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                                                    <Users size={28} className="text-emerald-500" />
                                                </div>
                                                <div>
                                                    <p className="text-white font-bold text-lg">{t('noReferrals')}</p>
                                                    <p className="text-emerald-400 text-sm mt-1">{t('noReferralsDesc')}</p>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    referrals.map((ref) => (
                                        <tr key={ref.id} className="hover:bg-emerald-500/5 transition-colors">
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-emerald-700/50 overflow-hidden flex items-center justify-center border border-emerald-500/30 shrink-0">
                                                        {ref.image ? (
                                                            <img src={ref.image} alt={ref.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <span className="text-emerald-300 uppercase font-black text-sm">{ref.name[0]}</span>
                                                        )}
                                                    </div>
                                                    <span className="font-bold text-white">{ref.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 text-emerald-300 font-medium text-sm">
                                                {new Date(ref.joinedAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-8 py-5 text-center">
                                                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-black bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                                                    +{ref.totalEarnedForReferrer}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                {isActiveToday(ref.lastActive) ? (
                                                    <span className="inline-flex items-center gap-1.5 text-green-400 font-bold text-xs uppercase tracking-wider">
                                                        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                                                        {t('activeToday')}
                                                    </span>
                                                ) : (
                                                    <span className="text-emerald-600 font-medium text-xs uppercase tracking-wider">
                                                        {t('offline')}
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({ icon, label, value, suffix }: { icon: React.ReactNode; label: string; value: number; suffix: string }) {
    return (
        <div className="glass-card rounded-2xl p-5 border border-emerald-500/20 hover:border-emerald-400/30 transition-all">
            <div className="w-9 h-9 rounded-xl bg-emerald-900/50 flex items-center justify-center mb-3 border border-emerald-500/20">
                {icon}
            </div>
            <p className="text-emerald-400 font-bold text-xs uppercase tracking-widest mb-1">{label}</p>
            <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-white">{value}</span>
                <span className="text-xs font-bold text-emerald-500 uppercase tracking-tight">{suffix}</span>
            </div>
        </div>
    );
}
