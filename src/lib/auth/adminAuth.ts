import { auth } from './config';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || '';

export function isAdminEmail(email: string | null | undefined): boolean {
    return !!email && email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
}

export async function requireAdmin() {
    const session = await auth();

    if (!session?.user?.email || !isAdminEmail(session.user.email)) {
        return null;
    }

    return session;
}
