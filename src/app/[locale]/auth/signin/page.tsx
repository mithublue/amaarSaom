import { Link } from '@/i18n/routing';
import { auth, signIn } from '@/lib/auth/config';
import { redirect } from 'next/navigation';

export default async function SignInPage() {
    const session = await auth();

    // If already signed in, redirect to home
    if (session) {
        redirect('/');
    }

    return (
        <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-0 left-0 w-64 h-64 bg-accent-500/10 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary-600/10 rounded-full translate-x-1/3 translate-y-1/3 blur-3xl"></div>

            <div className="max-w-md w-full relative z-10 animate-fade-in">
                {/* Logo/Icon */}
                <div className="flex flex-col items-center text-center mb-10 mt-10">
                    <div className="inline-flex w-24 h-24 rounded-3xl bg-linear-to-br from-accent-500 to-accent-600 shadow-gold-glow items-center justify-center mb-6 ring-4 ring-white/10 group hover:scale-105 transition duration-500">
                        <span className="text-6xl group-hover:rotate-12 transition duration-500">🌙</span>
                    </div>
                    <h1 className="text-4xl font-heading font-bold text-white mb-2 drop-shadow-md">
                        Ramadan Companion
                    </h1>
                    <p className="text-primary-200 text-lg">
                        Your spiritual journey partner
                    </p>
                </div>

                {/* Sign In Card */}
                <div className="bg-primary-900/40 backdrop-blur-md rounded-app-lg border border-white/10 shadow-glass p-8">
                    <h2 className="text-2xl font-bold text-white mb-6 text-center">
                        Welcome Back! 🤲
                    </h2>
                    <p className="text-primary-200 text-center mb-8 font-light">
                        Sign in to track your prayers, good deeds, and compete with your community
                    </p>

                    {/* Google Sign In Button */}
                    <form
                        action={async () => {
                            "use server"
                            await signIn("google", { redirectTo: "/" });
                        }}
                    >
                        <button
                            type="submit"
                            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white hover:bg-gray-50 text-gray-800 font-semibold rounded-2xl shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all duration-300"
                        >
                            <svg className="w-6 h-6" viewBox="0 0 24 24">
                                <path
                                    fill="#4285F4"
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                />
                                <path
                                    fill="#34A853"
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                />
                                <path
                                    fill="#FBBC05"
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                />
                                <path
                                    fill="#EA4335"
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                />
                            </svg>
                            Continue with Google
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="mt-8 pt-6 border-t border-white/10">
                        <p className="text-center text-primary-400 text-xs md:text-sm">
                            By signing in, you agree to track your spiritual journey and compete with your community in good deeds 🌟
                        </p>
                    </div>
                </div>

                {/* Back to Home */}
                <div className="text-center mt-8">
                    <Link
                        href="/"
                        className="text-primary-300 hover:text-white font-semibold transition px-4 py-2 rounded-lg hover:bg-white/5 inline-block"
                    >
                        ← Back to Home
                    </Link>
                </div>
            </div>
        </div>
    );
}
