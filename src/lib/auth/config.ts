import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { prisma } from '@/lib/db/prisma';
import type { NextAuthConfig } from 'next-auth';

export const authConfig: NextAuthConfig = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
    ],
    pages: {
        signIn: '/auth/signin',
        error: '/auth/error',
    },
    callbacks: {
        async signIn({ user, account, profile }) {
            if (!user.email) return false;

            try {
                // Check if user exists, if not create them
                const existingUser = await prisma.user.findUnique({
                    where: { email: user.email },
                });

                if (!existingUser) {
                    // Create new user
                    await prisma.user.create({
                        data: {
                            email: user.email,
                            name: user.name || '',
                            image: user.image,
                            language: 'en',
                        },
                    });
                }

                return true;
            } catch (error) {
                console.error('Error in signIn callback:', error);
                return false;
            }
        },
        async jwt({ token, user, account }) {
            // Initial sign in
            if (user) {
                // Fetch user from database to get location data
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
                    token.language = dbUser.language;
                }
            }
            return token;
        },
        async session({ session, token }) {
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
    session: {
        strategy: 'jwt',
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
