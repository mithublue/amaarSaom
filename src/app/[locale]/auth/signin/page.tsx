'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { Suspense } from 'react';

function SignInForm() {
    const searchParams = useSearchParams();
    const verified = searchParams.get('verified');
    const errorParam = searchParams.get('error');

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const errorMessages: Record<string, string> = {
        missing_token: 'Verification link is invalid.',
        invalid_token: 'Verification link is invalid or already used.',
        expired_token: 'Verification link has expired. Please register again.',
        server_error: 'Something went wrong. Please try again.',
        CredentialsSignin: 'Invalid email or password.',
    };

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await signIn('credentials', {
                email,
                password,
                redirect: false,
            });

            if (res?.error) {
                if (res.error === 'CredentialsSignin') {
                    setError('Invalid email or password, or email not verified.');
                } else {
                    setError(res.error);
                }
            } else {
                window.location.href = '/';
            }
        } catch {
            setError('Network error. Please try again.');
        }
        setLoading(false);
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
                        <h1 className="text-2xl font-bold text-white mb-1">Welcome Back</h1>
                        <p className="text-sm text-primary-400">Sign in to continue</p>
                    </div>

                    {/* Verified Banner */}
                    {verified && (
                        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-3 rounded-xl text-sm mb-6 text-center">
                            ✅ Email verified successfully! You can now sign in.
                        </div>
                    )}

                    {/* Error Banner */}
                    {(errorParam || error) && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm mb-6">
                            ❌ {error || errorMessages[errorParam || ''] || errorParam}
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
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
                                placeholder="Your password"
                                className="w-full bg-primary-800/60 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-primary-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-all shadow-lg shadow-emerald-500/20"
                        >
                            {loading ? '⏳ Signing in...' : '🔑 Sign In'}
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
                        onClick={() => signIn('google', { callbackUrl: '/' })}
                        className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        Sign in with Google
                    </button>

                    {/* Link to register */}
                    <p className="text-center text-sm text-primary-400 mt-6">
                        Don&apos;t have an account?{' '}
                        <a href="/en/auth/register" className="text-emerald-400 hover:underline font-medium">
                            Create Account
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

export default function SignInPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-primary-950 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        }>
            <SignInForm />
        </Suspense>
    );
}
