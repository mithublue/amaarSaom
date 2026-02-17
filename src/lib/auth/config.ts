import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { prisma } from '@/lib/db/prisma';
import { authConfig } from './auth.config';

export const config = {
    ...authConfig,
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        }),
    ],
    callbacks: {
        ...authConfig.callbacks,
        async signIn({ user, account, profile }: { user: any, account: any, profile: any }) {
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
                            preferredLanguage: 'en',
                        },
                    });
                }

                return true;
            } catch (error) {
                console.error('Error in signIn callback:', error);
                return false;
            }
        },
        async jwt({ token, user, account }: { token: any, user: any, account: any }) {
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
                    token.language = dbUser.preferredLanguage;
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
