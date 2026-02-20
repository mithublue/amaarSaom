import nodemailer from 'nodemailer';

function getTransporter() {
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.SMTP_EMAIL,
            pass: process.env.SMTP_PASSWORD,
        },
    });
}

export async function sendVerificationEmail(email: string, token: string): Promise<boolean> {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const verifyUrl = `${appUrl}/api/auth/verify?token=${token}`;

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0a0f1a; color: #e2e8f0; margin: 0; padding: 40px 20px; }
            .container { max-width: 500px; margin: 0 auto; background: #111827; border-radius: 16px; border: 1px solid rgba(255,255,255,0.08); overflow: hidden; }
            .header { text-align: center; padding: 32px 24px 16px; }
            .header h1 { font-size: 28px; margin: 0; color: #ffffff; }
            .header p { color: #9ca3af; font-size: 14px; margin-top: 8px; }
            .content { padding: 0 32px 32px; text-align: center; }
            .btn { display: inline-block; background: linear-gradient(135deg, #059669, #047857); color: #ffffff !important; padding: 14px 40px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 15px; margin: 20px 0; }
            .expire { color: #6b7280; font-size: 12px; margin-top: 16px; }
            .footer { text-align: center; padding: 16px; border-top: 1px solid rgba(255,255,255,0.05); color: #4b5563; font-size: 11px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🌙 Nuzul</h1>
                <p>Verify your email to get started</p>
            </div>
            <div class="content">
                <p style="color: #d1d5db; font-size: 15px; line-height: 1.6;">
                    Assalamu Alaikum! Click the button below to verify your email address and start your spiritual journey.
                </p>
                <a href="${verifyUrl}" class="btn">✅ Verify My Email</a>
                <p class="expire">This link expires in 24 hours.</p>
            </div>
            <div class="footer">
                If you didn't create an account, you can safely ignore this email.
            </div>
        </div>
    </body>
    </html>
    `;

    try {
        console.log('[Email] Sending verification to:', email);
        console.log('[Email] SMTP_EMAIL:', process.env.SMTP_EMAIL ? 'SET' : 'NOT SET');
        console.log('[Email] SMTP_PASSWORD:', process.env.SMTP_PASSWORD ? 'SET' : 'NOT SET');

        const transporter = getTransporter();

        await transporter.sendMail({
            from: `"Nuzul" <${process.env.SMTP_EMAIL}>`,
            to: email,
            subject: '✅ Verify your email — Nuzul',
            html,
        });

        console.log('[Email] ✅ Sent successfully to:', email);
        return true;
    } catch (error) {
        console.error('[Email] ❌ Send error:', error);
        return false;
    }
}
