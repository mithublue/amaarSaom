import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from '@/lib/db/prisma';
import { sendVerificationEmail } from '@/lib/services/emailService';
import { sendSlackNotification } from '@/lib/services/slackService';

export async function POST(req: Request) {
    try {
        const { name, email, password } = await req.json();

        // Validate
        if (!name || !email || !password) {
            return NextResponse.json(
                { error: 'Name, email, and password are required' },
                { status: 400 }
            );
        }

        if (password.length < 6) {
            return NextResponse.json(
                { error: 'Password must be at least 6 characters' },
                { status: 400 }
            );
        }

        // Check existing user
        const existing = await prisma.user.findUnique({
            where: { email: email.toLowerCase().trim() },
        });

        if (existing) {
            // If user exists but registered via Google (no password), let them set a password
            if (!existing.passwordHash) {
                return NextResponse.json(
                    { error: 'This email is already registered via Google. Please sign in with Google.' },
                    { status: 409 }
                );
            }
            return NextResponse.json(
                { error: 'An account with this email already exists' },
                { status: 409 }
            );
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 12);

        // Create user
        await prisma.user.create({
            data: {
                email: email.toLowerCase().trim(),
                name: name.trim(),
                passwordHash,
                emailVerified: false,
                preferredLanguage: 'en',
            },
        });

        // Generate verification token
        const token = crypto.randomBytes(32).toString('hex');
        await prisma.verificationToken.create({
            data: {
                email: email.toLowerCase().trim(),
                token,
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
            },
        });

        // Send verification email
        const emailSent = await sendVerificationEmail(email.toLowerCase().trim(), token);

        // Slack notification
        sendSlackNotification('register', {
            userName: name,
            email: email,
            extra: 'Email/Password registration',
        }).catch(() => { });

        return NextResponse.json({
            success: true,
            message: emailSent
                ? 'Account created! Please check your email to verify.'
                : 'Account created but failed to send verification email. Please try again later.',
        });
    } catch (error) {
        console.error('Registration error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
