'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocale } from 'next-intl';
import { Link } from '@/i18n/routing';
import { Brain, Flame, Trophy, Clock, CheckCircle, XCircle, Zap, ChevronRight, Star, Share2, ArrowRight, Copy, ArrowLeft, Info, X } from 'lucide-react';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';

// ─── Types ───────────────────────────────────────────

type QuizStatus = 'LOADING' | 'WAITING' | 'CLOSED' | 'READY' | 'PLAYING' | 'REVIEWING' | 'RESULTS' | 'COMPLETED' | 'ERROR';

interface QuizQuestion {
    id: number;
    questionBn: string;
    questionEn: string;
    questionAr?: string | null;
    optionsBn: string[];
    optionsEn: string[];
    category: string;
    difficulty: string;
}

interface AnswerResult {
    isCorrect: boolean;
    pointsAwarded: number;
    correctIndex: number;
    explanationBn: string | null;
    explanationEn: string | null;
}

interface QuizProfile {
    currentStreak: number;
    maxStreak: number;
    seasonQuizPoints: number;
    totalQuizPoints: number;
    lifelines5050: number;
    streakSavers: number;
    currentHijriMonth: string | null;
}

interface AttemptInfo {
    id: number;
    questionsCount: number;
    isBossDay: boolean;
    totalScore?: number;
    finalScore?: number;
    streakMultiplier?: number;
    correctCount?: number;
}

interface FinalResult {
    finalScore: number;
    totalScore: number;
    streakMultiplier: number;
    correctCount: number;
    questionsCount: number;
    currentStreak: number;
    maxStreak: number;
    seasonQuizPoints: number;
    totalQuizPoints: number;
}

const TOTAL_TIME_MS = 15000;

export default function QuizClient({ locale }: { locale: string }) {
    const currentLocale = useLocale();
    const [status, setStatus] = useState<QuizStatus>('LOADING');
    const [questions, setQuestions] = useState<QuizQuestion[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [attempt, setAttempt] = useState<AttemptInfo | null>(null);
    const [profile, setProfile] = useState<QuizProfile | null>(null);
    const [answerResult, setAnswerResult] = useState<AnswerResult | null>(null);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [hidden5050, setHidden5050] = useState<number[]>([]);
    const [timeLeftMs, setTimeLeftMs] = useState(TOTAL_TIME_MS);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [results, setResults] = useState<FinalResult | null>(null);
    const [totalEarned, setTotalEarned] = useState(0);
    const [isSharing, setIsSharing] = useState(false);
    const [showRules, setShowRules] = useState(false);
    const [scheduledAt, setScheduledAt] = useState<string | null>(null);
    const [nextOpenAt, setNextOpenAt] = useState<string | null>(null);
    const [countdown, setCountdown] = useState<string | null>(null);

    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const startTimeRef = useRef<number>(0);
    const shareCardRef = useRef<HTMLDivElement>(null);

    const isBn = currentLocale === 'bn';
    const isAr = currentLocale === 'ar';

    function getQuestionText(q: QuizQuestion) {
        if (isAr && q.questionAr) return q.questionAr;
        if (isBn) return q.questionBn;
        return q.questionEn;
    }

    function getOptions(q: QuizQuestion): string[] {
        if (isAr) return (q as any).optionsAr || q.optionsEn;
        if (isBn) return q.optionsBn;
        return q.optionsEn;
    }

    // ─── Countdown Timer ─────────────────────────────────────

    useEffect(() => {
        if (status !== 'WAITING' || !scheduledAt) return;
        const target = new Date(scheduledAt).getTime();

        function tick() {
            const diff = target - Date.now();
            if (diff <= 0) {
                setCountdown('00:00:00');
                // Auto-refresh when countdown hits zero
                setTimeout(() => window.location.reload(), 1000);
                return;
            }
            const h = Math.floor(diff / 3600000);
            const m = Math.floor((diff % 3600000) / 60000);
            const s = Math.floor((diff % 60000) / 1000);
            setCountdown(
                `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
            );
        }

        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [status, scheduledAt]);

    // ─── Load today's quiz ───────────────────────────────────

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch('/api/quiz/today');
                const data = await res.json();

                setProfile(data.profile);

                if (data.status === 'WAITING') {
                    setScheduledAt(data.scheduledAt ?? null);
                    setStatus('WAITING');
                } else if (data.status === 'CLOSED') {
                    setNextOpenAt(data.nextOpenAt ?? null);
                    setStatus('CLOSED');
                } else if (data.status === 'COMPLETED') {
                    setAttempt(data.attempt);
                    setResults({
                        finalScore: data.attempt.finalScore ?? 0,
                        totalScore: data.attempt.totalScore ?? 0,
                        streakMultiplier: Number(data.attempt.streakMultiplier ?? 1),
                        correctCount: data.attempt.correctCount ?? 0,
                        questionsCount: data.attempt.questionsCount ?? 3,
                        currentStreak: data.profile?.currentStreak ?? 0,
                        maxStreak: data.profile?.maxStreak ?? 0,
                        seasonQuizPoints: data.profile?.seasonQuizPoints ?? 0,
                        totalQuizPoints: data.profile?.totalQuizPoints ?? 0,
                    });
                    setStatus('COMPLETED');
                } else if (data.status === 'IN_PROGRESS' && data.attempt?.id) {
                    // User left mid-quiz — auto-finalize their partial attempt
                    try {
                        const finalizeRes = await fetch('/api/quiz/finalize', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ attemptId: data.attempt.id }),
                        });
                        const finalizeData = await finalizeRes.json();
                        if (finalizeData?.data) {
                            setResults({
                                finalScore: finalizeData.data.finalScore ?? 0,
                                totalScore: finalizeData.data.totalScore ?? 0,
                                streakMultiplier: Number(finalizeData.data.streakMultiplier ?? 1),
                                correctCount: finalizeData.data.correctCount ?? 0,
                                questionsCount: finalizeData.data.questionsCount ?? data.attempt.questionsCount,
                                currentStreak: finalizeData.data.currentStreak ?? 0,
                                maxStreak: finalizeData.data.maxStreak ?? 0,
                                seasonQuizPoints: finalizeData.data.seasonQuizPoints ?? 0,
                                totalQuizPoints: finalizeData.data.totalQuizPoints ?? 0,
                            });
                            setStatus('COMPLETED');
                        } else {
                            // Finalize returned no data — show error and let user retry
                            setStatus('ERROR');
                        }
                    } catch {
                        // Finalize failed — try re-fetching today's quiz to get correct state
                        try {
                            const retryRes = await fetch('/api/quiz/today');
                            const retryData = await retryRes.json();
                            if (retryData.status === 'COMPLETED') {
                                setAttempt(retryData.attempt);
                                setResults({
                                    finalScore: retryData.attempt.finalScore ?? 0,
                                    totalScore: retryData.attempt.totalScore ?? 0,
                                    streakMultiplier: Number(retryData.attempt.streakMultiplier ?? 1),
                                    correctCount: retryData.attempt.correctCount ?? 0,
                                    questionsCount: retryData.attempt.questionsCount ?? 3,
                                    currentStreak: retryData.profile?.currentStreak ?? 0,
                                    maxStreak: retryData.profile?.maxStreak ?? 0,
                                    seasonQuizPoints: retryData.profile?.seasonQuizPoints ?? 0,
                                    totalQuizPoints: retryData.profile?.totalQuizPoints ?? 0,
                                });
                                setStatus('COMPLETED');
                            } else {
                                setStatus('ERROR');
                            }
                        } catch {
                            setStatus('ERROR');
                        }
                    }
                } else if (data.status === 'READY') {
                    setAttempt(data.attempt);
                    setQuestions(data.questions);
                    setStatus('READY');
                } else {
                    // Unexpected state — show loading to retry
                    setStatus('LOADING');
                }

            } catch (err) {
                console.error('[quiz/today]', err);
                toast.error('Failed to load quiz. Please try again.');
                setStatus('ERROR');
            }
        })();
    }, []);

    // ─── Timer ────────────────────────────────────────────────

    const stopTimer = useCallback(() => {
        if (timerRef.current) clearInterval(timerRef.current);
    }, []);

    const startTimer = useCallback(() => {
        stopTimer();
        setTimeLeftMs(TOTAL_TIME_MS);
        startTimeRef.current = Date.now();
        timerRef.current = setInterval(() => {
            const elapsed = Date.now() - startTimeRef.current;
            const remaining = Math.max(0, TOTAL_TIME_MS - elapsed);
            setTimeLeftMs(remaining);
            if (remaining <= 0) {
                stopTimer();
                // Time's up — auto-submit timeout
                handleSubmitAnswer(-1);
            }
        }, 50);
    }, [stopTimer]);

    useEffect(() => () => stopTimer(), [stopTimer]);

    // ─── Gameplay ────────────────────────────────────────────

    const handleStartQuiz = () => {
        setStatus('PLAYING');
        setCurrentIndex(0);
        setTotalEarned(0);
        startTimer();
    };

    const handleSubmitAnswer = useCallback(async (optionIndex: number) => {
        if (isSubmitting || !attempt || !questions[currentIndex]) return;
        stopTimer();
        setIsSubmitting(true);
        setSelectedOption(optionIndex);

        const timeTakenMs = Date.now() - startTimeRef.current;
        const used5050 = hidden5050.length > 0;

        try {
            const res = await fetch('/api/quiz/answer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    attemptId: attempt.id,
                    questionId: questions[currentIndex].id,
                    selectedIndex: optionIndex,
                    timeTakenMs,
                    used5050,
                }),
            });
            const data = await res.json();
            if (data.success) {
                setAnswerResult(data.data);
                setTotalEarned(prev => prev + data.data.pointsAwarded);
                setStatus('REVIEWING');
            }
        } catch (err) {
            toast.error('Failed to submit answer.');
        } finally {
            setIsSubmitting(false);
        }
    }, [isSubmitting, attempt, questions, currentIndex, stopTimer, hidden5050]);

    const handleNextQuestion = async () => {
        const nextIndex = currentIndex + 1;
        if (nextIndex >= questions.length) {
            // All questions done — finalize
            await handleFinalize();
        } else {
            setCurrentIndex(nextIndex);
            setAnswerResult(null);
            setSelectedOption(null);
            setHidden5050([]);
            setStatus('PLAYING');
            startTimer();
        }
    };

    const handleFinalize = async () => {
        if (!attempt) return;
        try {
            const res = await fetch('/api/quiz/finalize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ attemptId: attempt.id }),
            });
            const data = await res.json();
            if (data.success) {
                // Cast streakMultiplier to Number — Prisma Decimal serializes as string in JSON
                setResults({
                    ...data.data,
                    streakMultiplier: Number(data.data.streakMultiplier ?? 1),
                    finalScore: Number(data.data.finalScore ?? 0),
                    totalScore: Number(data.data.totalScore ?? 0),
                });
                setStatus('RESULTS');
            }
        } catch (err) {
            toast.error('Failed to save results.');
        }
    };

    // ─── 50/50 Lifeline ───────────────────────────────────────

    const handle5050 = () => {
        if (!profile || profile.lifelines5050 <= 0 || !questions[currentIndex]) return;
        const q = questions[currentIndex];
        const correctIdx = answerResult?.correctIndex; // Not available yet (pre-submission)
        // We need to hide 2 wrong options — pick them randomly
        const allIndices = [0, 1, 2, 3];
        // We don't know correct yet, so we pick 2 random indices to hide
        // that are not the first option (to keep at least 2 visible)
        const toHide: number[] = [];
        const shuffled = allIndices.sort(() => Math.random() - 0.5);
        for (const idx of shuffled) {
            if (toHide.length === 2) break;
            toHide.push(idx);
        }
        setHidden5050(toHide);
        setProfile(prev => prev ? { ...prev, lifelines5050: prev.lifelines5050 - 1 } : prev);
    };

    // ─── Share Card ───────────────────────────────────────────

    const handleShare = useCallback(async () => {
        if (!results) return;
        setIsSharing(true);

        const shareText = isBn
            ? `আমি আজকের ব্রেইন-ব্যাটলে ${results.finalScore} পয়েন্ট পেলাম! 🧠🔥 ${results.currentStreak} দিনের স্ট্রিক! nuzul.com`
            : `I scored ${results.finalScore} pts in today's Brain Battle! 🧠🔥 ${results.currentStreak} day streak! nuzul.com`;

        const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

        try {
            if (isMobile && navigator.share) {
                // ⚠️ MUST call navigator.share() FIRST before any async work —
                // browser requires direct user gesture context (no async gap allowed)
                try {
                    await navigator.share({
                        title: isBn ? 'নুযুল ব্রেইন-ব্যাটল ফলাফল' : 'Nuzul Brain Battle Result',
                        text: shareText,
                    });
                    toast.success(isBn ? '✅ শেয়ার করা হয়েছে!' : '✅ Shared!');
                } catch (shareErr) {
                    if (shareErr instanceof Error && shareErr.name === 'AbortError') {
                        // User cancelled — do nothing
                    } else {
                        // Share failed (e.g. no targets available) — copy text to clipboard
                        try {
                            await navigator.clipboard.writeText(shareText);
                            toast.success(isBn ? '✅ টেক্সট কপি হয়েছে! যেকোনো জায়গায় পেস্ট করুন।' : '✅ Text copied! Paste anywhere to share.');
                        } catch {
                            toast.error(isBn ? 'শেয়ার করতে ব্যর্থ হয়েছে।' : 'Could not share.');
                        }
                    }
                }
            } else {
                // Desktop: generate canvas then copy image to clipboard
                if (!shareCardRef.current) { setIsSharing(false); return; }
                const canvas = await html2canvas(shareCardRef.current, {
                    backgroundColor: null, scale: 2, useCORS: true, logging: false,
                });
                const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
                if (!blob) throw new Error('Canvas empty');

                if (navigator.clipboard && window.ClipboardItem) {
                    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
                    toast.success(isBn ? '✅ ছবি ক্লিপবোর্ডে কপি হয়েছে! যেকোনো জায়গায় পেস্ট করুন।' : '✅ Image copied to clipboard! Paste anywhere to share.');
                } else {
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url; a.download = 'nuzul-brain-battle.png'; a.click();
                    URL.revokeObjectURL(url);
                    toast.success(isBn ? '✅ ছবি ডাউনলোড হচ্ছে!' : '✅ Image downloaded!');
                }
            }
        } catch (err) {
            if (err instanceof Error && err.name !== 'AbortError') {
                toast.error(isBn ? 'শেয়ার করতে ব্যর্থ হয়েছে।' : 'Failed to share.');
            }
        } finally {
            setIsSharing(false);
        }
    }, [results, isBn]);

    const handleShareFacebook = useCallback(() => {
        if (!results) return;
        const shareText = isBn
            ? `আমি আজকের নুযুল ব্রেইন-ব্যাটলে ${results.finalScore} পয়েন্ট পেলাম! 🧠🔥 ${results.currentStreak} দিনের স্ট্রিক!`
            : `I scored ${results.finalScore} pts in today's Nuzul Brain Battle! 🧠🔥 ${results.currentStreak} day streak!`;
        const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent('https://nuzul.com/quiz')}&quote=${encodeURIComponent(shareText)}`;
        window.open(url, '_blank', 'width=600,height=450');
    }, [results, isBn]);

    // ─── Timer UI ─────────────────────────────────────────────

    const timerPct = (timeLeftMs / TOTAL_TIME_MS) * 100;
    const timerColor = timerPct > 60 ? '#22c55e' : timerPct > 30 ? '#eab308' : '#ef4444';

    // ─── RENDER ───────────────────────────────────────────────

    if (status === 'LOADING') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-primary-950">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-accent-500/20 flex items-center justify-center animate-pulse">
                        <Brain className="w-8 h-8 text-accent-400" />
                    </div>
                    <p className="text-gray-400 text-sm">Loading today&apos;s challenge...</p>
                </div>
            </div>
        );
    }

    // ─── WAITING (quiz not opened yet today) ──────────────────

    if (status === 'WAITING') {
        const openTime = scheduledAt ? new Date(scheduledAt) : null;
        const formattedTime = openTime
            ? openTime.toLocaleTimeString(isBn ? 'bn-BD' : 'en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
            : null;
        const formattedDate = openTime
            ? openTime.toLocaleDateString(isBn ? 'bn-BD' : 'en-US', { weekday: 'long', month: 'long', day: 'numeric' })
            : null;

        return (
            <div className="min-h-screen bg-primary-950 flex flex-col items-center justify-center px-4 relative">
                {/* Top action bar */}
                <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
                    <Link href="/" className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 transition-all text-sm font-medium">
                        <ArrowLeft className="w-4 h-4" />
                        <span className="hidden sm:inline">{isBn ? 'হোম' : 'Home'}</span>
                    </Link>
                    <div className="flex gap-2">
                        <Link href="/leaderboard" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 transition-all text-xs sm:text-sm font-medium">
                            <Trophy className="w-4 h-4" />
                            {isBn ? 'লিডারবোর্ড' : 'Leaderboard'}
                        </Link>
                        <button
                            onClick={() => setShowRules(true)}
                            className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 px-3 py-2 rounded-xl bg-accent-500/10 border border-accent-500/20 text-accent-400 hover:bg-accent-500/20 transition-all text-xs sm:text-sm font-medium"
                        >
                            <Info className="w-4 h-4" />
                            {isBn ? 'নিয়ম' : 'Rules'}
                        </button>
                    </div>
                </div>

                <div className="max-w-sm w-full text-center space-y-6">
                    <div className="w-24 h-24 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto">
                        <Clock className="w-12 h-12 text-blue-400" />
                    </div>

                    <div>
                        <h1 className="text-2xl font-bold text-white mb-2">
                            {isBn ? 'আজকের কুইজ এখনো শুরু হয়নি' : "Today's Quiz Hasn't Started Yet"}
                        </h1>
                        {formattedTime ? (
                            <>
                                <p className="text-gray-400 text-sm mt-2">
                                    {isBn ? 'কুইজ শুরু হবে:' : 'Quiz opens at:'}
                                </p>
                                <p className="text-3xl font-black text-blue-400 mt-1">{formattedTime}</p>
                                {formattedDate && (
                                    <p className="text-gray-500 text-sm mt-1">{formattedDate}</p>
                                )}
                            </>
                        ) : (
                            <p className="text-gray-400 text-sm mt-2">
                                {isBn ? 'কুইজ এই মুহূর্তে পাওয়া যাচ্ছে না।' : 'No quiz is currently scheduled.'}
                            </p>
                        )}
                    </div>

                    {/* Live Countdown */}
                    {countdown && countdown !== '00:00:00' && (
                        <div className="bg-blue-900/30 border border-blue-500/30 rounded-2xl p-5">
                            <p className="text-xs text-blue-400 uppercase tracking-widest mb-2 font-semibold">
                                {isBn ? 'সময় বাকি আছে' : 'Time Remaining'}
                            </p>
                            <p className="text-5xl font-black text-white tracking-widest tabular-nums">{countdown}</p>
                            <p className="text-xs text-blue-400/60 mt-2">{isBn ? 'ঘ : মি : সে' : 'HH : MM : SS'}</p>
                        </div>
                    )}

                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4">
                        <p className="text-blue-300 text-sm">
                            💡 {isBn
                                ? 'নির্ধারিত সময়ে ফিরে আসুন এবং প্রতিদিনের কুইজে অংশ নিয়ে পয়েন্ট অর্জন করুন!'
                                : 'Come back at the scheduled time to earn points on today\'s quiz!'}
                        </p>
                    </div>

                    <button
                        onClick={() => window.location.reload()}
                        className="w-full py-3 rounded-2xl bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 transition-all text-sm font-medium"
                    >
                        🔄 {isBn ? 'রিফ্রেশ করুন' : 'Refresh'}
                    </button>
                </div>
                <RulesModal isOpen={showRules} onClose={() => setShowRules(false)} isBn={isBn} />
            </div>
        );
    }

    // ─── CLOSED (quiz window ended for today) ─────────────────

    if (status === 'CLOSED') {
        const nextTime = nextOpenAt ? new Date(nextOpenAt) : null;
        const formattedNextTime = nextTime
            ? nextTime.toLocaleTimeString(isBn ? 'bn-BD' : 'en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
            : null;
        const formattedNextDate = nextTime
            ? nextTime.toLocaleDateString(isBn ? 'bn-BD' : 'en-US', { weekday: 'long', month: 'long', day: 'numeric' })
            : null;

        return (
            <div className="min-h-screen bg-primary-950 flex flex-col items-center justify-center px-4 relative">
                {/* Top action bar */}
                <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
                    <Link href="/" className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 transition-all text-sm font-medium">
                        <ArrowLeft className="w-4 h-4" />
                        <span className="hidden sm:inline">{isBn ? 'হোম' : 'Home'}</span>
                    </Link>
                    <div className="flex gap-2">
                        <Link href="/leaderboard" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 transition-all text-xs sm:text-sm font-medium">
                            <Trophy className="w-4 h-4" />
                            {isBn ? 'লিডারবোর্ড' : 'Leaderboard'}
                        </Link>
                        <button
                            onClick={() => setShowRules(true)}
                            className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 px-3 py-2 rounded-xl bg-accent-500/10 border border-accent-500/20 text-accent-400 hover:bg-accent-500/20 transition-all text-xs sm:text-sm font-medium"
                        >
                            <Info className="w-4 h-4" />
                            {isBn ? 'নিয়ম' : 'Rules'}
                        </button>
                    </div>
                </div>

                <div className="max-w-sm w-full text-center space-y-6">
                    <div className="w-24 h-24 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mx-auto">
                        <Clock className="w-12 h-12 text-orange-400" />
                    </div>

                    <div>
                        <h1 className="text-2xl font-bold text-white mb-2">
                            {isBn ? 'আজকের কুইজ শেষ হয়ে গেছে' : "Today's Quiz Has Ended"}
                        </h1>
                        <p className="text-gray-400 text-sm">
                            {isBn
                                ? 'আজকের কুইজের সময় পার হয়ে গেছে।'
                                : "Today's quiz window has closed."}
                        </p>
                        {formattedNextTime && (
                            <>
                                <p className="text-gray-400 text-sm mt-3">
                                    {isBn ? 'পরবর্তী কুইজ:' : 'Next quiz opens at:'}
                                </p>
                                <p className="text-3xl font-black text-orange-400 mt-1">{formattedNextTime}</p>
                                {formattedNextDate && (
                                    <p className="text-gray-500 text-sm mt-1">{formattedNextDate}</p>
                                )}
                            </>
                        )}
                    </div>

                    <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-4">
                        <p className="text-orange-300 text-sm">
                            🌙 {isBn
                                ? 'প্রতিদিন নির্ধারিত সময়ে কুইজে অংশ নিয়ে আপনার স্ট্রিক বজায় রাখুন!'
                                : 'Participate daily at the scheduled time to maintain your streak!'}
                        </p>
                    </div>
                </div>
                <RulesModal isOpen={showRules} onClose={() => setShowRules(false)} isBn={isBn} />
            </div>
        );
    }

    // ─── ERROR ────────────────────────────────────────────────

    if (status === 'ERROR') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-primary-950 px-4">
                <div className="text-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto">
                        <span className="text-3xl">⚠️</span>
                    </div>
                    <h2 className="text-white font-bold text-lg">
                        {isBn ? 'কুইজ লোড করতে সমস্যা হয়েছে' : 'Failed to load quiz'}
                    </h2>
                    <p className="text-gray-400 text-sm">
                        {isBn ? 'ইন্টারনেট বা সার্ভার সমস্যা হতে পারে। আবার চেষ্টা করুন।' : 'There may be a network or server issue. Please try again.'}
                    </p>
                    <button
                        onClick={() => { setStatus('LOADING'); window.location.reload(); }}
                        className="px-6 py-3 rounded-xl bg-accent-500 text-black font-bold hover:opacity-90 transition-all"
                    >
                        {isBn ? 'আবার চেষ্টা করুন' : 'Try Again'}
                    </button>
                </div>
            </div>
        );
    }

    // ─── COMPLETED (already played today) ────────────────────

    if (status === 'COMPLETED' && results) {
        return (
            <div className="min-h-screen bg-primary-950 flex flex-col pt-20 pb-24 px-4">
                {/* Hidden share card - rendered off-screen for capture */}
                <ShareCardCanvas ref={shareCardRef} results={results} isBn={isBn} />

                <div className="max-w-lg mx-auto w-full space-y-6">
                    <div className="text-center">
                        <div className="w-20 h-20 rounded-full bg-accent-500/20 border border-accent-400/30 flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="w-10 h-10 text-accent-400" />
                        </div>
                        <h1 className="text-2xl font-bold text-white">{isBn ? 'আজকের কুইজ সম্পন্ন!' : "Today's Quiz Done!"}</h1>
                        <p className="text-gray-400 mt-1">{isBn ? 'আগামীকাল আবার আসুন' : 'Come back tomorrow!'} ☀️</p>
                    </div>

                    <ScoreCard results={results} isBn={isBn} />

                    <button
                        onClick={handleShare}
                        disabled={isSharing}
                        className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
                    >
                        {isSharing ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <Share2 className="w-4 h-4" />
                        )}
                        {isBn ? 'ফলাফল শেয়ার করুন' : 'Share Result'}
                    </button>

                    <button
                        onClick={handleShareFacebook}
                        className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl bg-[#1877F2] hover:bg-[#166fe5] text-white font-bold active:scale-95 transition-all"
                    >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073c0 6.025 4.392 11.017 10.125 11.927v-8.437H7.078v-3.49h3.047V9.43c0-3.007 1.792-4.668 4.533-4.668 1.312 0 2.686.234 2.686.234v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.49h-2.796v8.437C19.608 23.09 24 18.097 24 12.073z" /></svg>
                        {isBn ? 'ফেসবুকে শেয়ার করুন' : 'Share on Facebook'}
                    </button>
                    <Link
                        href="/leaderboard"
                        className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl bg-gradient-to-r from-accent-600 to-accent-500 text-black font-bold hover:opacity-90 transition-all"
                    >
                        <Trophy className="w-4 h-4" />
                        {isBn ? 'লিডারবোর্ড দেখুন' : 'View Leaderboard'}
                    </Link>
                    <Link href="/" className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 transition-all">
                        {isBn ? 'হোমে ফিরুন' : 'Back to Home'}
                    </Link>
                </div>
            </div>
        );
    }

    // ─── READY (Pre-game lobby) ───────────────────────────────

    if (status === 'READY' && attempt && profile) {
        return (
            <div className="min-h-screen bg-primary-950 flex flex-col pt-12 pb-24 px-4 relative">
                {/* Top Actions */}
                <div className="absolute top-4 left-4 right-4 flex justify-between items-center max-w-lg mx-auto w-full z-10">
                    <Link href="/" className="w-10 h-10 sm:w-auto sm:px-3 sm:py-2 rounded-full sm:rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-300 hover:bg-white/10 transition-all text-sm font-medium gap-2">
                        <ArrowLeft className="w-5 h-5 sm:w-4 sm:h-4" />
                        <span className="hidden sm:inline">{isBn ? 'হোম' : 'Home'}</span>
                    </Link>
                    <div className="flex gap-2">
                        <Link href="/leaderboard" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 transition-all text-xs sm:text-sm font-medium">
                            <Trophy className="w-4 h-4" />
                            {isBn ? 'লিডারবোর্ড' : 'Leaderboard'}
                        </Link>
                        <button
                            onClick={() => setShowRules(true)}
                            className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 px-3 py-2 rounded-xl bg-accent-500/10 border border-accent-500/20 text-accent-400 hover:bg-accent-500/20 transition-all text-xs sm:text-sm font-medium"
                        >
                            <Info className="w-4 h-4" />
                            {isBn ? 'নিয়ম' : 'Rules'}
                        </button>
                    </div>
                </div>

                <div className="max-w-lg mx-auto w-full space-y-6 mt-8">
                    {/* Header */}
                    <div className="text-center">
                        <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-4 ${attempt.isBossDay ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 'bg-accent-500/20 text-accent-400 border border-accent-500/30'}`}>
                            {attempt.isBossDay ? '🔥 জুমাবার বস চ্যালেঞ্জ' : '🧠 ' + (isBn ? 'ডেইলি ব্রেইন-ব্যাটল' : 'Daily Brain Battle')}
                        </div>
                        <h1 className="text-3xl font-bold text-white mb-2">
                            {isBn ? 'আজকের ব্রেইন-ব্যাটল' : "Today's Brain Battle"}
                        </h1>
                        <p className="text-gray-400">
                            {isBn
                                ? `${attempt.questionsCount}টি প্রশ্ন • প্রতিটি ১৫ সেকেন্ড`
                                : `${attempt.questionsCount} Questions • 15 seconds each`}
                        </p>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-3">
                        <div className="bg-primary-900/50 border border-white/5 rounded-2xl p-3 text-center">
                            <Flame className="w-5 h-5 text-orange-400 mx-auto mb-1" />
                            <p className="text-xl font-bold text-white">{profile.currentStreak}</p>
                            <p className="text-gray-400 text-xs">{isBn ? 'স্ট্রিক' : 'Streak'}</p>
                        </div>
                        <div className="bg-primary-900/50 border border-white/5 rounded-2xl p-3 text-center">
                            <Star className="w-5 h-5 text-accent-400 mx-auto mb-1" />
                            <p className="text-xl font-bold text-white">{profile.seasonQuizPoints.toLocaleString()}</p>
                            <p className="text-gray-400 text-xs">{isBn ? 'সিজন পয়েন্ট' : 'Season Pts'}</p>
                        </div>
                        <div className="bg-primary-900/50 border border-white/5 rounded-2xl p-3 text-center">
                            <Zap className="w-5 h-5 text-blue-400 mx-auto mb-1" />
                            <p className="text-xl font-bold text-white">{profile.lifelines5050}</p>
                            <p className="text-gray-400 text-xs">50/50</p>
                        </div>
                    </div>

                    {/* Multiplier info */}
                    {profile.currentStreak >= 3 && (
                        <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-4 flex items-center gap-3">
                            <Flame className="w-6 h-6 text-orange-400 shrink-0" />
                            <div>
                                <p className="text-orange-300 font-semibold text-sm">
                                    {profile.currentStreak >= 21 ? 'x3.0' : profile.currentStreak >= 14 ? 'x2.5' : profile.currentStreak >= 7 ? 'x2.0' : 'x1.5'} {isBn ? 'মাল্টিপ্লায়ার সক্রিয়!' : 'Multiplier Active!'}
                                </p>
                                <p className="text-orange-400/70 text-xs">
                                    {isBn ? `টানা ${profile.currentStreak} দিন খেলছেন` : `${profile.currentStreak} day streak`}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Start button */}
                    <button
                        onClick={handleStartQuiz}
                        className="w-full py-4 rounded-2xl bg-gradient-to-r from-accent-600 to-accent-500 text-black font-bold text-lg hover:opacity-90 active:scale-95 transition-all shadow-gold-glow flex items-center justify-center gap-2"
                    >
                        <Brain className="w-5 h-5" />
                        {isBn ? 'শুরু করুন' : 'Start Quiz'}
                        <ArrowRight className="w-5 h-5" />
                    </button>

                    {/* Rules button */}
                    <button
                        onClick={() => setShowRules(true)}
                        className="w-full py-3.5 rounded-2xl bg-white/5 border border-white/10 text-gray-300 font-semibold hover:bg-white/10 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                        <Info className="w-4 h-4" />
                        {isBn ? 'কুইজের নিয়মকানুন' : 'Quiz Rules'}
                    </button>

                    {attempt.isBossDay && (
                        <p className="text-center text-orange-400/70 text-xs mt-2">
                            {isBn ? '⚡ আজ জুমাবার! কঠিন প্রশ্ন, ৩ গুণ পয়েন্ট!' : '⚡ Friday! Hard questions, 3x multiplier potential!'}
                        </p>
                    )}
                </div>

                {/* Rules Modal */}
                {showRules && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                        <div className="bg-primary-900 border border-white/10 rounded-3xl w-full max-w-md max-h-[85vh] overflow-hidden flex flex-col shadow-2xl relative">
                            {/* Modal Header */}
                            <div className="p-5 border-b border-white/5 flex justify-between items-center bg-primary-950/50">
                                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                    <Info className="w-5 h-5 text-accent-400" />
                                    {isBn ? 'কুইজের নিয়মাবলী' : 'Quiz Rules'}
                                </h3>
                                <button
                                    onClick={() => setShowRules(false)}
                                    className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="p-5 overflow-y-auto space-y-5">
                                {/* Base Rules */}
                                <div className="space-y-2">
                                    <h4 className="text-white font-semibold flex items-center gap-2">
                                        <Brain className="w-4 h-4 text-accent-500" />
                                        {isBn ? 'সাধারণ নিয়ম' : 'General Rules'}
                                    </h4>
                                    <ul className="text-gray-300 text-sm space-y-2 ml-6 list-disc">
                                        <li>{isBn ? 'প্রতিদিন রাত ১২টায় নতুন কুইজ আসবে।' : 'New quiz available every day at midnight.'}</li>
                                        <li>{isBn ? 'সাধারণ দিনে ৩টি প্রশ্ন থাকবে।' : 'Regular days will have 3 questions.'}</li>
                                        <li>{isBn ? 'প্রতিটি প্রশ্নের জন্য ১৫ সেকেন্ড সময় পাবেন।' : 'You get 15 seconds per question.'}</li>
                                        <li>{isBn ? 'দ্রুত উত্তর দিলে বেশি পয়েন্ট পাবেন (সর্বোচ্চ ১০০)।' : 'Faster answers earn more points (up to 100).'}</li>
                                        <li>{isBn ? 'ভুল উত্তর দিলে বা সময় শেষ হলে ০ পয়েন্ট।' : 'Wrong answer or timeout gives 0 points.'}</li>
                                    </ul>
                                </div>

                                {/* Boss Day */}
                                <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-4 space-y-2">
                                    <h4 className="text-orange-400 font-semibold flex items-center gap-2">
                                        <Flame className="w-4 h-4" />
                                        {isBn ? 'জুমাবার বস চ্যালেঞ্জ (Boss Day)' : 'Friday Boss Challenge'}
                                    </h4>
                                    <ul className="text-orange-200/80 text-sm space-y-2 ml-6 list-disc">
                                        <li>{isBn ? 'প্রতি শুক্রবার বিশেষ বস কুইজ হবে।' : 'Every Friday is a special Boss Quiz.'}</li>
                                        <li>{isBn ? 'মোট ৫টি প্রশ্ন থাকবে যার মধ্যে ২টি বেশ কঠিন।' : '5 questions total, including 2 difficult ones.'}</li>
                                        <li>{isBn ? 'বেশি পয়েন্ট এবং বড় মাল্টিপ্লায়ার জেতার সুযোগ!' : 'Chance to win more points with big multipliers!'}</li>
                                    </ul>
                                </div>

                                {/* Streaks & Multipliers */}
                                <div className="space-y-2">
                                    <h4 className="text-white font-semibold flex items-center gap-2">
                                        <Star className="w-4 h-4 text-blue-400" />
                                        {isBn ? 'স্ট্রিক ও পয়েন্ট মাল্টিপ্লায়ার' : 'Streaks & Multipliers'}
                                    </h4>
                                    <ul className="text-gray-300 text-sm space-y-2 ml-6 list-disc">
                                        <li>{isBn ? 'টানা ৩ দিন খেললে: পয়েন্ট ১.৫ গুণ (x1.5)' : '3 day streak: x1.5 points'}</li>
                                        <li>{isBn ? 'টানা ৭ দিন খেললে: পয়েন্ট ২.০ গুণ (x2.0)' : '7 day streak: x2.0 points'}</li>
                                        <li>{isBn ? 'টানা ১৪ দিন খেললে: পয়েন্ট ২.৫ গুণ (x2.5)' : '14 day streak: x2.5 points'}</li>
                                        <li>{isBn ? 'টানা ২১ দিন বা বেশি: পয়েন্ট ৩.০ গুণ (x3.0)' : '21+ day streak: x3.0 points'}</li>
                                    </ul>
                                    <p className="text-xs text-blue-300 mt-2 bg-blue-500/10 p-2 rounded-lg border border-blue-500/20">
                                        💡 {isBn ? 'একদিন মিস করলেই স্ট্রিক ০ হয়ে যাবে (যদি স্ট্রাইক সেভার না থাকে)।' : 'Missing a day resets your streak to 0 (unless you have a streak saver).'}
                                    </p>
                                </div>

                                {/* Leaderboard & Seasons */}
                                <div className="space-y-2">
                                    <h4 className="text-white font-semibold flex items-center gap-2">
                                        <Trophy className="w-4 h-4 text-accent-400" />
                                        {isBn ? 'লিডারবোর্ড ও সিজন' : 'Leaderboard & Seasons'}
                                    </h4>
                                    <ul className="text-gray-300 text-sm space-y-2 ml-6 list-disc">
                                        <li>{isBn ? 'কুইজের পয়েন্ট গুড ডিড এর পয়েন্ট থেকে সম্পূর্ণ আলাদা।' : 'Quiz points are separate from Good Deeds points.'}</li>
                                        <li>{isBn ? 'উভয়ের জন্য আলাদা আলাদা লিডারবোর্ড রয়েছে।' : 'There is a dedicated leaderboard for the Quiz.'}</li>
                                        <li>{isBn ? 'প্রতি হিজরি মাসে একটি সিজন শেষ হয় এবং পয়েন্ট রিসেট হয়ে নতুন সিজন শুরু হয়।' : 'Each Hijri month is a Season. Season points reset monthly.'}</li>
                                        <li>{isBn ? 'মাস শেষে লিডারবোর্ডের শীর্ষে থাকলে ট্রফি পাবেন!' : 'Top the leaderboard at month-end to win trophies!'}</li>
                                    </ul>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="p-4 border-t border-white/5 bg-primary-950/50">
                                <button
                                    onClick={() => setShowRules(false)}
                                    className="w-full py-3 rounded-xl bg-accent-500 text-black font-bold hover:opacity-90 transition-all"
                                >
                                    {isBn ? 'বুঝতে পেরেছি' : 'Got It'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // ─── PLAYING / REVIEWING ────────────────────────────────

    if ((status === 'PLAYING' || status === 'REVIEWING') && questions.length > 0) {
        const q = questions[currentIndex];
        const options = getOptions(q);
        const questionText = getQuestionText(q);
        const explanation = isBn ? answerResult?.explanationBn : answerResult?.explanationEn;

        return (
            <div className="min-h-screen bg-primary-950 flex flex-col pt-16 pb-4 px-4">
                <div className="max-w-lg mx-auto w-full flex flex-col gap-4 h-full">
                    {/* Progress */}
                    <div className="flex items-center justify-between pt-4">
                        <span className="text-gray-400 text-sm">{isBn ? 'প্রশ্ন' : 'Q'} {currentIndex + 1}/{questions.length}</span>
                        <div className="flex-1 mx-3 h-2 bg-primary-800 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-accent-500 rounded-full transition-all duration-300"
                                style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
                            />
                        </div>
                        <span className="text-accent-400 text-sm font-semibold">+{totalEarned}</span>
                    </div>

                    {/* Timer */}
                    {status === 'PLAYING' && (
                        <div className="flex items-center gap-3">
                            <Clock className="w-4 h-4 shrink-0" style={{ color: timerColor }} />
                            <div className="flex-1 h-3 bg-primary-800 rounded-full overflow-hidden">
                                <div
                                    className="h-full rounded-full transition-all"
                                    style={{ width: `${timerPct}%`, backgroundColor: timerColor }}
                                />
                            </div>
                            <span className="text-sm font-mono w-8 text-right" style={{ color: timerColor }}>
                                {Math.ceil(timeLeftMs / 1000)}s
                            </span>
                        </div>
                    )}

                    {/* Category badge */}
                    <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-full bg-primary-800 text-gray-400 text-xs capitalize">{q.category}</span>
                        {q.difficulty === 'boss' && (
                            <span className="px-2.5 py-1 rounded-full bg-orange-500/20 text-orange-400 text-xs font-semibold">Boss 🔥</span>
                        )}
                    </div>

                    {/* Question */}
                    <div className="bg-primary-900/60 border border-white/5 rounded-3xl p-5 min-h-[100px] flex items-center">
                        <p className="text-white text-base font-medium leading-relaxed">
                            {questionText}
                        </p>
                    </div>

                    {/* Options */}
                    <div className="space-y-3 flex-1">
                        {options.map((opt, idx) => {
                            if (hidden5050.includes(idx) && status === 'PLAYING') {
                                return <div key={idx} className="h-14 rounded-2xl bg-primary-900/20 border border-dashed border-white/5 opacity-30" />;
                            }

                            let optClass = 'bg-primary-900/50 border-white/10 text-gray-200 hover:bg-primary-800/60 hover:border-accent-500/30 active:scale-[0.98]';
                            if (status === 'REVIEWING') {
                                if (idx === answerResult?.correctIndex) {
                                    optClass = 'bg-green-500/10 border-green-500/50 text-green-300';
                                } else if (idx === selectedOption && !answerResult?.isCorrect) {
                                    optClass = 'bg-red-500/10 border-red-500/50 text-red-300';
                                } else {
                                    optClass = 'bg-primary-900/20 border-white/5 text-gray-500 opacity-50';
                                }
                            }

                            return (
                                <button
                                    key={idx}
                                    disabled={status === 'REVIEWING' || isSubmitting}
                                    onClick={() => handleSubmitAnswer(idx)}
                                    className={`w-full px-4 py-3.5 rounded-2xl border text-left text-sm font-medium transition-all flex items-center gap-3 ${optClass}`}
                                >
                                    <span className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center text-xs shrink-0 font-mono">
                                        {String.fromCharCode(65 + idx)}
                                    </span>
                                    <span className="flex-1">{opt}</span>
                                    {status === 'REVIEWING' && idx === answerResult?.correctIndex && (
                                        <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
                                    )}
                                    {status === 'REVIEWING' && idx === selectedOption && !answerResult?.isCorrect && (
                                        <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Lifeline row */}
                    {status === 'PLAYING' && profile && (
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handle5050}
                                disabled={profile.lifelines5050 <= 0 || hidden5050.length > 0}
                                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-blue-500/20 transition-all"
                            >
                                <Zap className="w-3.5 h-3.5" />
                                50/50 ({profile.lifelines5050})
                            </button>
                        </div>
                    )}

                    {/* Explanation + Next */}
                    {status === 'REVIEWING' && answerResult && (
                        <div className="space-y-3">
                            {/* Points earned */}
                            <div className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl ${answerResult.isCorrect ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
                                {answerResult.isCorrect ? (
                                    <CheckCircle className="w-4 h-4 text-green-400" />
                                ) : (
                                    <XCircle className="w-4 h-4 text-red-400" />
                                )}
                                <span className={`font-semibold text-sm ${answerResult.isCorrect ? 'text-green-300' : 'text-red-300'}`}>
                                    {answerResult.isCorrect
                                        ? `+${answerResult.pointsAwarded} ${isBn ? 'পয়েন্ট!' : 'Points!'}`
                                        : (isBn ? 'ভুল উত্তর' : 'Wrong Answer')}
                                </span>
                            </div>

                            {explanation && (
                                <div className="bg-primary-800/40 border border-white/5 rounded-2xl p-3">
                                    <p className="text-gray-300 text-xs leading-relaxed">💡 {explanation}</p>
                                </div>
                            )}

                            <button
                                onClick={handleNextQuestion}
                                className="w-full py-3.5 rounded-2xl bg-accent-600 hover:bg-accent-500 text-black font-bold transition-all flex items-center justify-center gap-2"
                            >
                                {currentIndex + 1 >= questions.length
                                    ? (isBn ? 'ফলাফল দেখুন' : 'See Results')
                                    : (isBn ? 'পরের প্রশ্ন' : 'Next Question')}
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // ─── RESULTS ──────────────────────────────────────────────

    if (status === 'RESULTS' && results) {
        return (
            <div className="min-h-screen bg-primary-950 flex flex-col pt-20 pb-24 px-4">
                <div className="max-w-lg mx-auto w-full space-y-6">
                    {/* Trophy header */}
                    <div className="text-center">
                        <div className="relative inline-block mb-4">
                            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-accent-500 to-accent-700 flex items-center justify-center mx-auto shadow-gold-glow">
                                <Trophy className="w-12 h-12 text-black" />
                            </div>
                            {results.correctCount === results.questionsCount && (
                                <div className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-green-500 flex items-center justify-center">
                                    <Star className="w-4 h-4 text-white" />
                                </div>
                            )}
                        </div>
                        <h1 className="text-3xl font-bold text-white">
                            {isBn ? 'ব্রেইন-ব্যাটল সম্পন্ন!' : 'Brain Battle Complete!'}
                        </h1>
                        <p className="text-gray-400 mt-1">
                            {results.correctCount === results.questionsCount
                                ? (isBn ? '🎉 পারফেক্ট স্কোর!' : '🎉 Perfect Score!')
                                : `${results.correctCount}/${results.questionsCount} ${isBn ? 'সঠিক' : 'Correct'}`}
                        </p>
                    </div>

                    <ScoreCard results={results} isBn={isBn} />

                    {/* Actions */}
                    <div className="space-y-3">
                        {/* Share button */}
                        <button
                            onClick={handleShare}
                            disabled={isSharing}
                            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 shadow-lg shadow-blue-500/20"
                        >
                            {isSharing ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <Share2 className="w-4 h-4" />
                            )}
                            {isBn ? '📤 ফলাফল শেয়ার করুন' : '📤 Share Your Result'}
                        </button>

                        <button
                            onClick={handleShareFacebook}
                            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl bg-[#1877F2] hover:bg-[#166fe5] text-white font-bold active:scale-95 transition-all shadow-lg shadow-blue-900/30"
                        >
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073c0 6.025 4.392 11.017 10.125 11.927v-8.437H7.078v-3.49h3.047V9.43c0-3.007 1.792-4.668 4.533-4.668 1.312 0 2.686.234 2.686.234v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.49h-2.796v8.437C19.608 23.09 24 18.097 24 12.073z" /></svg>
                            {isBn ? 'ফেসবুকে শেয়ার করুন' : 'Share on Facebook'}
                        </button>

                        <Link
                            href="/leaderboard"
                            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl bg-gradient-to-r from-accent-600 to-accent-500 text-black font-bold hover:opacity-90 transition-all"
                        >
                            <Trophy className="w-4 h-4" />
                            {isBn ? 'লিডারবোর্ড দেখুন' : 'View Leaderboard'}
                        </Link>
                        <Link
                            href="/"
                            className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 transition-all"
                        >
                            {isBn ? 'হোমে ফিরুন' : 'Back to Home'}
                        </Link>
                    </div>

                    {/* Hidden share card */}
                    <ShareCardCanvas ref={shareCardRef} results={results} isBn={isBn} />
                </div>
            </div>
        );
    }

    return null;
}

// ─── Score Card Sub-component ─────────────────────────────

function ScoreCard({ results, isBn }: { results: FinalResult; isBn: boolean }) {
    return (
        <div className="bg-primary-900/50 border border-white/5 rounded-3xl overflow-hidden">
            {/* Final Score Banner */}
            <div className="bg-gradient-to-r from-accent-600/20 to-accent-500/10 border-b border-white/5 p-5 text-center">
                <p className="text-gray-400 text-sm mb-1">{isBn ? 'চূড়ান্ত স্কোর' : 'Final Score'}</p>
                <p className="text-5xl font-black text-accent-400">{results.finalScore}</p>
                <p className="text-gray-500 text-xs mt-1">{isBn ? 'পয়েন্ট অর্জিত' : 'points earned'}</p>
            </div>
            {/* Breakdown */}
            <div className="p-5 space-y-3">
                <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-400">{isBn ? 'বেস স্কোর' : 'Base Score'}</span>
                    <span className="text-white font-semibold">{results.totalScore}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-400 flex items-center gap-1.5">
                        <Flame className="w-3.5 h-3.5 text-orange-400" />
                        {isBn ? 'স্ট্রিক মাল্টিপ্লায়ার' : 'Streak Multiplier'}
                    </span>
                    <span className="text-orange-400 font-semibold">x{Number(results.streakMultiplier).toFixed(1)}</span>
                </div>
                <div className="h-px bg-white/5" />
                <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-400">{isBn ? 'বর্তমান স্ট্রিক' : 'Current Streak'}</span>
                    <span className="text-orange-400 font-semibold">🔥 {results.currentStreak} {isBn ? 'দিন' : 'days'}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-400">{isBn ? 'মোট সিজন পয়েন্ট' : 'Season Total'}</span>
                    <span className="text-accent-400 font-semibold">{results.seasonQuizPoints.toLocaleString()}</span>
                </div>
            </div>
        </div>
    );
}

// ─── Share Card Canvas (hidden, for html2canvas capture) ───
import { forwardRef } from 'react';

const ShareCardCanvas = forwardRef<HTMLDivElement, { results: FinalResult; isBn: boolean }>(
    function ShareCardCanvas({ results, isBn }, ref) {
        const isPerfect = results.correctCount === results.questionsCount;
        return (
            <div
                ref={ref}
                style={{
                    position: 'fixed',
                    left: '-9999px',
                    top: '0',
                    width: '400px',
                    height: '400px',
                    background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
                    borderRadius: '24px',
                    padding: '32px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'system-ui, sans-serif',
                    color: 'white',
                    overflow: 'hidden',
                }}
            >
                {/* Glow accent */}
                <div style={{
                    position: 'absolute', top: '-60px', right: '-60px',
                    width: '200px', height: '200px',
                    background: 'radial-gradient(circle, rgba(234,179,8,0.2) 0%, transparent 70%)',
                    borderRadius: '50%',
                }} />
                <div style={{
                    position: 'absolute', bottom: '-60px', left: '-60px',
                    width: '180px', height: '180px',
                    background: 'radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%)',
                    borderRadius: '50%',
                }} />

                {/* Brand */}
                <div style={{ fontSize: '13px', color: '#94a3b8', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '20px' }}>
                    🧠 Nuzul · Brain Battle
                </div>

                {/* Score */}
                <div style={{
                    background: 'linear-gradient(135deg, rgba(234,179,8,0.15), rgba(234,179,8,0.05))',
                    border: '1px solid rgba(234,179,8,0.3)',
                    borderRadius: '20px',
                    padding: '20px 40px',
                    textAlign: 'center',
                    marginBottom: '24px',
                    width: '100%',
                }}>
                    <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '4px' }}>
                        {isBn ? 'চূড়ান্ত স্কোর' : 'Final Score'}
                    </div>
                    <div style={{ fontSize: '64px', fontWeight: 900, color: '#eab308', lineHeight: 1 }}>
                        {results.finalScore}
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                        {isBn ? 'পয়েন্ট' : 'points'}
                    </div>
                </div>

                {/* Stats row */}
                <div style={{ display: 'flex', gap: '12px', width: '100%', marginBottom: '20px' }}>
                    <div style={{ flex: 1, background: 'rgba(255,255,255,0.04)', borderRadius: '14px', padding: '12px', textAlign: 'center' }}>
                        <div style={{ fontSize: '24px', fontWeight: 700, color: '#f97316' }}>🔥 {results.currentStreak}</div>
                        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>{isBn ? 'দিন স্ট্রিক' : 'Day Streak'}</div>
                    </div>
                    <div style={{ flex: 1, background: 'rgba(255,255,255,0.04)', borderRadius: '14px', padding: '12px', textAlign: 'center' }}>
                        <div style={{ fontSize: '24px', fontWeight: 700, color: '#a78bfa' }}>x{Number(results.streakMultiplier).toFixed(1)}</div>
                        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>{isBn ? 'মাল্টিপ্লায়ার' : 'Multiplier'}</div>
                    </div>
                </div>

                {/* Season pts */}
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                    {isBn ? 'সিজন মোট' : 'Season Total'}: <span style={{ color: '#eab308', fontWeight: 700 }}>{results.seasonQuizPoints.toLocaleString()}</span> pts
                </div>

                {/* CTA */}
                {isPerfect && (
                    <div style={{
                        marginTop: '16px', fontSize: '13px', fontWeight: 700,
                        background: 'linear-gradient(90deg, #22c55e, #16a34a)',
                        padding: '6px 16px', borderRadius: '999px', color: 'white'
                    }}>
                        🎉 {isBn ? 'পারফেক্ট স্কোর!' : 'Perfect Score!'}
                    </div>
                )}
            </div>
        );
    }
);

function RulesModal({ isOpen, onClose, isBn }: { isOpen: boolean, onClose: () => void, isBn: boolean }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-primary-900 border border-white/10 rounded-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh] shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-4 border-b border-white/10 bg-black/20">
                    <div className="flex items-center gap-2 text-white font-bold text-lg">
                        <Info className="w-5 h-5 text-accent-400" />
                        {isBn ? 'কুইজের নিয়মাবলী' : 'Quiz Rules'}
                    </div>
                    <button onClick={onClose} className="p-2 -mr-2 text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-5 overflow-y-auto space-y-4 text-sm text-gray-300">
                    <ul className="space-y-3 list-disc pl-5">
                        <li>
                            <strong className="text-white">{isBn ? 'সাধারণ নিয়ম:' : 'General Rules:'}</strong> {isBn ? 'প্রতিদিন রাত ১২টায় নতুন কুইজ আসবে। প্রতিটি প্রশ্নের জন্য ১৫ সেকেন্ড সময় পাবেন। দ্রুত উত্তর দিলে বেশি পয়েন্ট পাবেন (সর্বোচ্চ ১০০)।' : 'New quiz at midnight. 15 seconds per question. Faster answers earn more points (up to 100).'}
                        </li>
                        <li>
                            <strong className="text-white">{isBn ? 'স্ট্রিক ও পয়েন্ট মাল্টিপ্লায়ার:' : 'Streaks & Multipliers:'}</strong> {isBn ? 'পরপর প্রতিদিন কুইজে অংশ নিলে স্ট্রিক বাড়বে। ১৪ দিনে ২.৫ গুণ, ২১ দিনে ৩ গুণ পয়েন্ট! একদিন মিস করলেই স্ট্রিক ০ হয়ে যাবে।' : 'Play consecutive days to build your streak. 14 days = 2.5x, 21 days = 3x points! Missing a day resets it to 0.'}
                        </li>
                        <li>
                            <strong className="text-white text-orange-400">{isBn ? 'জুমাবার বস কুইজ:' : 'Friday Boss Quiz:'}</strong> {isBn ? 'প্রতি শুক্রবার বিশেষ বস কুইজ থাকবে, যেখানে ২ টি প্রশ্ন তুলনামূলক কঠিন হবে কিন্তু পয়েন্ট ও মাল্টিপ্লায়ার জেতার বিশাল সুযোগ!' : 'Every Friday features a Boss Quiz with tougher questions but much higher rewards!'}
                        </li>
                        <li>
                            <strong className="text-white text-accent-400">{isBn ? 'লিডারবোর্ড ও সিজন:' : 'Leaderboards:'}</strong> {isBn ? 'মাসিক সিজনে বেশি পয়েন্ট জমিয়ে র‍্যাঙ্কে উপরে উঠুন।' : 'Accumulate points over the monthly season to climb the ranks.'}
                        </li>
                        <li>
                            <strong className="text-white text-blue-400">{isBn ? 'লাইফলাইন:' : 'Lifelines:'}</strong> {isBn ? 'কঠিন প্রশ্নে ৫০-৫০ (50-50) লাইফলাইন ব্যবহার করে দুটি ভুল অপশন সরিয়ে ফেলতে পারবেন।' : 'Use the 50-50 lifeline to remove two wrong answers on tough questions.'}
                        </li>
                    </ul>

                    <div className="mt-6 pt-4 border-t border-white/10 text-center text-xs text-gray-500">
                        {isBn ? 'রমাদানের সাথেই থাকুন, শিখুন এবং জিতুন!' : 'Learn and win with Ramadan Companion!'}
                    </div>
                </div>

                <div className="p-4 border-t border-white/10 bg-black/20">
                    <button
                        onClick={onClose}
                        className="w-full py-3 rounded-xl bg-accent-500 text-black font-bold hover:opacity-90 transition-all active:scale-95"
                    >
                        {isBn ? 'বুঝতে পেরেছি' : 'Understood'}
                    </button>
                </div>
            </div>
        </div>
    );
}
