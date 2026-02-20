'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

export default function RegisterPage() {
    const router = useRouter();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password }),
            });
            const data = await res.json();

            if (data.success) {
                setSuccess(true);
            } else {
                setError(data.error || 'Registration failed');
            }
        } catch {
            setError('Network error. Please try again.');
        }
        setLoading(false);
    }

    if (success) {
        return (
            <main className="min-h-screen bg-primary-950 flex items-center justify-center px-4">
                <div className="w-full max-w-md text-center">
                    <div className="bg-primary-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-glass">
                        <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <span className="text-4xl">📧</span>
                        </div>
                        <h1 className="text-2xl font-bold text-white mb-3">Check Your Email!</h1>
                        <p className="text-primary-300 mb-6 leading-relaxed">
                            We&apos;ve sent a verification link to <strong className="text-emerald-400">{email}</strong>.
                            Please click the link to verify your account.
                        </p>
                        <p className="text-xs text-primary-500 mb-6">The link expires in 24 hours.</p>
                        <a
                            href="/en/auth/signin"
                            className="inline-block px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold transition-all"
                        >
                            Go to Sign In →
                        </a>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-primary-950 flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-md">
                <div className="bg-primary-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-glass">
                    {/* Header — logo links to home */}
                    <div className="text-center mb-8">
                        <a href="/" className="inline-flex flex-col items-center gap-1 group mb-4">
                            <span className="text-4xl group-hover:scale-110 transition-transform block">🌙</span>
                            <span className="text-sm font-bold text-emerald-400 group-hover:text-emerald-300 tracking-widest uppercase">Nuzul</span>
                        </a>
                        <h1 className="text-2xl font-bold text-white mb-1">Create Account</h1>
                        <p className="text-sm text-primary-400">Join Nuzul</p>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm mb-6">
                            ❌ {error}
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm text-primary-300 mb-1.5">Full Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                placeholder="Your name"
                                className="w-full bg-primary-800/60 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-primary-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition"
                            />
                        </div>

                        <div>
                            <label className="block text-sm text-primary-300 mb-1.5">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                placeholder="your@email.com"
                                className="w-full bg-primary-800/60 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-primary-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition"
                            />
                        </div>

                        <div>
                            <label className="block text-sm text-primary-300 mb-1.5">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                                placeholder="At least 6 characters"
                                className="w-full bg-primary-800/60 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-primary-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition"
                            />
                        </div>

                        <div>
                            <label className="block text-sm text-primary-300 mb-1.5">Confirm Password</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                placeholder="Confirm your password"
                                className="w-full bg-primary-800/60 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-primary-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-all shadow-lg shadow-emerald-500/20"
                        >
                            {loading ? '⏳ Creating Account...' : '✨ Create Account'}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="flex items-center gap-3 my-6">
                        <div className="flex-1 h-px bg-white/10"></div>
                        <span className="text-xs text-primary-500">OR</span>
                        <div className="flex-1 h-px bg-white/10"></div>
                    </div>

                    {/* Google */}
                    <button
                        onClick={() => {
                            const { signIn } = require('next-auth/react');
                            signIn('google', { callbackUrl: '/' });
                        }}
                        className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        Sign up with Google
                    </button>

                    {/* Link to sign-in */}
                    <p className="text-center text-sm text-primary-400 mt-6">
                        Already have an account?{' '}
                        <a href="/en/auth/signin" className="text-emerald-400 hover:underline font-medium">
                            Sign In
                        </a>
                    </p>

                    {/* Cancel */}
                    <div className="text-center mt-3">
                        <a
                            href="/"
                            className="text-xs text-primary-500 hover:text-primary-300 transition-colors"
                        >
                            ✕ Cancel and go back to home
                        </a>
                    </div>
                </div>
            </div>
        </main>
    );
}
