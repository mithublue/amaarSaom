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
        async signIn({ user, account, profile }: { user: any, account?: any, profile?: any }) {
            console.log('SignIn attempt:', { email: user?.email, provider: account?.provider });
            if (!user.email) {
                console.error('SignIn failed: No email provided');
                return false;
            }

            try {
                // Check if user exists, if not create them
                const existingUser = await prisma.user.findUnique({
                    where: { email: user.email },
                });

                if (!existingUser) {
                    console.log('Creating new user:', user.email);
                    // Create new user
                    await prisma.user.create({
                        data: {
                            email: user.email,
                            name: user.name || '',
                            image: user.image,
                            preferredLanguage: 'en',
                        },
                    });
                } else {
                    console.log('Existing user signed in:', user.email);
                }

                return true;
            } catch (error) {
                console.error('DATABASE ERROR in signIn callback:', error);
                return false;
            }
        },
        async jwt({ token, user, account }: { token: any, user?: any, account?: any }) {
            // Initial sign in
            if (user) {
                try {
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
