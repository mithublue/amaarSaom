'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocale } from 'next-intl';
import { Link } from '@/i18n/routing';
import { Brain, Flame, Trophy, Clock, CheckCircle, XCircle, Zap, Shield, ChevronRight, Star, Share2, ArrowRight, Award } from 'lucide-react';
import { toast } from 'sonner';

// ─── Types ───────────────────────────────────────────

type QuizStatus = 'LOADING' | 'READY' | 'PLAYING' | 'REVIEWING' | 'RESULTS' | 'COMPLETED';

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

    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const startTimeRef = useRef<number>(0);

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

    // ─── Load today's quiz ───────────────────────────────────

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch('/api/quiz/today');
                const data = await res.json();

                setProfile(data.profile);

                if (data.status === 'COMPLETED') {
                    setAttempt(data.attempt);
                    setResults({
                        finalScore: data.attempt.finalScore,
                        totalScore: data.attempt.totalScore,
                        streakMultiplier: data.attempt.streakMultiplier,
                        correctCount: data.attempt.correctCount,
                        questionsCount: data.attempt.questionsCount,
                        currentStreak: data.profile.currentStreak,
                        maxStreak: data.profile.maxStreak,
                        seasonQuizPoints: data.profile.seasonQuizPoints,
                        totalQuizPoints: data.profile.totalQuizPoints,
                    });
                    setStatus('COMPLETED');
                } else if (data.status === 'READY') {
                    setAttempt(data.attempt);
                    setQuestions(data.questions);
                    setStatus('READY');
                } else {
                    setStatus('READY'); // IN_PROGRESS or fallback
                }
            } catch (err) {
                console.error(err);
                toast.error('Failed to load quiz. Please try again.');
                setStatus('LOADING');
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
                setResults(data.data);
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

    // ─── COMPLETED (already played today) ────────────────────

    if (status === 'COMPLETED' && results) {
        return (
            <div className="min-h-screen bg-primary-950 flex flex-col pt-20 pb-24 px-4">
                <div className="max-w-lg mx-auto w-full space-y-6">
                    <div className="text-center">
                        <div className="w-20 h-20 rounded-full bg-accent-500/20 border border-accent-400/30 flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="w-10 h-10 text-accent-400" />
                        </div>
                        <h1 className="text-2xl font-bold text-white">{isBn ? 'আজকের কুইজ সম্পন্ন!' : "Today's Quiz Done!"}</h1>
                        <p className="text-gray-400 mt-1">{isBn ? 'আগামীকাল আবার আসুন' : 'Come back tomorrow!'} ☀️</p>
                    </div>

                    <ScoreCard results={results} isBn={isBn} />

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
            <div className="min-h-screen bg-primary-950 flex flex-col pt-20 pb-24 px-4">
                <div className="max-w-lg mx-auto w-full space-y-6">
                    {/* Header */}
                    <div className="text-center">
                        <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-4 ${attempt.isBossDay ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 'bg-accent-500/20 text-accent-400 border border-accent-500/30'}`}>
                            {attempt.isBossDay ? '🔥 জুমাবার বস চ্যালেঞ্জ' : '🧠 Daily Brain Battle'}
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

                    {attempt.isBossDay && (
                        <p className="text-center text-orange-400/70 text-xs">
                            {isBn ? '⚡ আজ জুমাবার! কঠিন প্রশ্ন, ৩ গুণ পয়েন্ট!' : '⚡ Friday! Hard questions, 3x multiplier potential!'}
                        </p>
                    )}
                </div>
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
                    <span className="text-orange-400 font-semibold">x{results.streakMultiplier.toFixed(1)}</span>
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
