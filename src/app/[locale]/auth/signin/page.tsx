import Link from 'next/link';
import { auth, signIn } from '@/lib/auth/config';
import { redirect } from 'next/navigation';

export default async function SignInPage() {
    const session = await auth();

    // If already signed in, redirect to home
    if (session) {
        redirect('/');
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-secondary-900 flex items-center justify-center px-4">
            <div className="max-w-md w-full">
                {/* Logo/Icon */}
                <div className="text-center mb-8">
                    <div className="inline-block w-24 h-24 rounded-3xl bg-gradient-to-br from-accent to-secondary shadow-2xl flex items-center justify-center mb-6">
                        <span className="text-6xl">🌙</span>
                    </div>
                    <h1 className="text-4xl font-bold text-white mb-2">
                        Ramadan Companion
                    </h1>
                    <p className="text-primary-200">
                        Your spiritual journey partner this Ramadan
                    </p>
                </div>

                {/* Sign In Card */}
                <div className="bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 p-8">
                    <h2 className="text-2xl font-bold text-white mb-6 text-center">
                        Welcome Back! 🤲
                    </h2>
                    <p className="text-primary-200 text-center mb-8">
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
                            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white text-gray-800 font-semibold rounded-2xl shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300"
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
                        <p className="text-center text-primary-300 text-sm">
                            By signing in, you agree to track your spiritual journey and compete with your community in good deeds 🌟
                        </p>
                    </div>
                </div>

                {/* Back to Home */}
                <div className="text-center mt-6">
                    <Link
                        href="/"
                        className="text-primary-200 hover:text-white transition"
                    >
                        ← Back to Home
                    </Link>
                </div>
            </div>
        </div>
    );
}
