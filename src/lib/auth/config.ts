import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db/prisma';
import { authConfig } from './auth.config';
import { sendSlackNotification } from '@/lib/services/slackService';

export const config = {
    ...authConfig,
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        }),
        CredentialsProvider({
            name: 'credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error('Email and password are required');
                }

                const email = (credentials.email as string).toLowerCase().trim();
                const password = credentials.password as string;

                const user = await prisma.user.findUnique({
                    where: { email },
                });

                if (!user || !user.passwordHash) {
                    throw new Error('Invalid email or password');
                }

                if (!user.emailVerified) {
                    throw new Error('Please verify your email before signing in');
                }

                const isValid = await bcrypt.compare(password, user.passwordHash);
                if (!isValid) {
                    throw new Error('Invalid email or password');
                }

                // Update last login
                await prisma.user.update({
                    where: { id: user.id },
                    data: { lastLoginAt: new Date() },
                });

                // Slack notification
                sendSlackNotification('login', {
                    userName: user.name,
                    email: user.email,
                    extra: 'Email/Password login',
                }).catch(() => { });

                return {
                    id: user.id.toString(),
                    email: user.email,
                    name: user.name,
                    image: user.image,
                };
            },
        }),
    ],
    callbacks: {
        ...authConfig.callbacks,
        async signIn({ user, account, profile }: { user: any, account?: any, profile?: any }) {
            // Skip for credentials — already handled in authorize()
            if (account?.provider === 'credentials') {
                return true;
            }

            console.log('SignIn attempt:', { email: user?.email, provider: account?.provider });
            if (!user.email) {
                console.error('SignIn failed: No email provided');
                return false;
            }

            try {
                const existingUser = await prisma.user.findUnique({
                    where: { email: user.email },
                });

                if (!existingUser) {
                    console.log('Creating new user:', user.email);
                    await prisma.user.create({
                        data: {
                            email: user.email,
                            name: user.name || '',
                            image: user.image,
                            preferredLanguage: 'en',
                            emailVerified: true, // Google users are auto-verified
                            lastLoginAt: new Date(),
                        },
                    });

                    sendSlackNotification('register', {
                        userName: user.name || '',
                        email: user.email,
                        extra: 'Google OAuth registration',
                    }).catch(() => { });
                } else {
                    console.log('Existing user signed in:', user.email);
                    await prisma.user.update({
                        where: { email: user.email },
                        data: {
                            lastLoginAt: new Date(),
                            emailVerified: true, // Ensure Google users always verified
                        },
                    });

                    sendSlackNotification('login', {
                        userName: existingUser.name,
                        email: user.email,
                    }).catch(() => { });
                }

                return true;
            } catch (error) {
                console.error('DATABASE ERROR in signIn callback:', error);
                return false;
            }
        },
        async jwt({ token, user, account }: { token: any, user?: any, account?: any }) {
            if (user) {
                try {
                    const dbUser = await prisma.user.findUnique({
                        where: { email: user.email! },
                        include: {
                            district: true,
                            division: true,
                            country: true,
                        },
                    });

                    if (dbUser) {
                        token.id = dbUser.id.toString();
                        token.districtId = dbUser.districtId;
                        token.divisionId = dbUser.divisionId;
                        token.countryId = dbUser.countryId;
                        token.language = dbUser.preferredLanguage;
                    }
                } catch (error) {
                    console.error('DATABASE ERROR in jwt callback:', error);
                }
            }
            return token;
        },
        async session({ session, token }: { session: any, token: any }) {
            if (session.user) {
                session.user.id = token.id as string;
                session.user.districtId = token.districtId as number | null;
                session.user.divisionId = token.divisionId as number | null;
                session.user.countryId = token.countryId as number | null;
                session.user.language = token.language as string | null;
            }
            return session;
        },
    },
};

export const { handlers, auth, signIn, signOut } = NextAuth(config);
