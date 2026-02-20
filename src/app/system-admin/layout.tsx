import { auth } from '@/lib/auth/config';
import { isAdminEmail } from '@/lib/auth/adminAuth';
import { redirect } from 'next/navigation';
import { Geist, Geist_Mono } from 'next/font/google';
import '../globals.css';

const geistSans = Geist({
    variable: '--font-geist-sans',
    subsets: ['latin'],
});

const geistMono = Geist_Mono({
    variable: '--font-geist-mono',
    subsets: ['latin'],
});

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();

    if (!session?.user?.email || !isAdminEmail(session.user.email)) {
        redirect('/');
    }

    return (
        <html lang="en" suppressHydrationWarning>
            <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-950 text-white`}>
                {children}
            </body>
        </html>
    );
}
