import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET(req: NextRequest) {
    const token = req.nextUrl.searchParams.get('token');

    if (!token) {
        return NextResponse.redirect(new URL('/en/auth/signin?error=missing_token', req.url));
    }

    try {
        // Find token
        const record = await prisma.verificationToken.findUnique({
            where: { token },
        });

        if (!record) {
            return NextResponse.redirect(new URL('/en/auth/signin?error=invalid_token', req.url));
        }

        // Check expiry
        if (new Date() > record.expiresAt) {
            // Clean up expired token
            await prisma.verificationToken.delete({ where: { id: record.id } });
            return NextResponse.redirect(new URL('/en/auth/signin?error=expired_token', req.url));
        }

        // Verify user
        await prisma.user.updateMany({
            where: { email: record.email },
            data: { emailVerified: true },
        });

        // Delete used token and any other tokens for this email
        await prisma.verificationToken.deleteMany({
            where: { email: record.email },
        });

        return NextResponse.redirect(new URL('/en/auth/signin?verified=true', req.url));
    } catch (error) {
        console.error('Verification error:', error);
        return NextResponse.redirect(new URL('/en/auth/signin?error=server_error', req.url));
    }
}
