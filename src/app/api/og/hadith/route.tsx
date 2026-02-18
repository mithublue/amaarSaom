import { ImageResponse } from 'next/og';
import { getHadithById, getHadithOfTheDay } from '@/lib/hadithService';

export const runtime = 'edge';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        const lang = searchParams.get('lang') || 'en';

        let hadith;
        if (id) {
            hadith = getHadithById(parseInt(id));
        } else {
            hadith = getHadithOfTheDay();
        }

        if (!hadith) {
            return new Response('Hadith not found', { status: 404 });
        }

        const text = lang === 'bn' ? hadith.textBn : lang === 'ar' ? hadith.textAr : hadith.textEn;
        const source = hadith.source;

        // Note: Edge runtime has limited emoji support and no local fonts by default unless loaded.
        // We will use standard fonts and simple emojis.

        return new ImageResponse(
            (
                <div
                    style={{
                        height: '100%',
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#022C22',
                        color: 'white',
                        padding: '40px',
                    }}
                >
                    {/* Background Pattern (CSS Radial Gradients are supported) */}
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundImage: 'radial-gradient(circle at 25px 25px, rgba(255, 255, 255, 0.05) 2%, transparent 0%), radial-gradient(circle at 75px 75px, rgba(255, 255, 255, 0.05) 2%, transparent 0%)',
                        backgroundSize: '100px 100px',
                    }} />

                    {/* Logo/Header */}
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 40, zIndex: 10 }}>
                        <div style={{ fontSize: 40, marginRight: 15 }}>🌙</div>
                        <div style={{ color: '#F59E0B', fontSize: 30, fontWeight: 900, letterSpacing: '0.1em' }}>RAMADAN COMPANION</div>
                    </div>

                    {/* Card */}
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textAlign: 'center',
                        backgroundColor: 'rgba(6, 78, 59, 0.8)', // Darker opaque for better contrast
                        borderRadius: 30,
                        border: '2px solid rgba(255, 255, 255, 0.1)',
                        padding: '60px',
                        width: '90%',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                        zIndex: 10,
                    }}>
                        <div style={{ fontSize: 60, marginBottom: 20, opacity: 0.3 }}>❝</div>

                        <div style={{
                            fontSize: text.length > 200 ? 36 : 48,
                            lineHeight: 1.4,
                            marginBottom: 40,
                            fontWeight: 600,
                            maxWidth: '90%',
                        }}>
                            {text}
                        </div>

                        <div style={{
                            width: 120,
                            height: 6,
                            backgroundColor: '#F59E0B',
                            borderRadius: 3,
                            marginBottom: 30,
                            opacity: 0.8
                        }}></div>

                        <div style={{
                            color: '#FCD34D',
                            fontSize: 28,
                            fontWeight: 700,
                            letterSpacing: '0.1em',
                            textTransform: 'uppercase',
                        }}>
                            — {source}
                        </div>
                    </div>

                    <div style={{ position: 'absolute', bottom: 40, opacity: 0.6, fontSize: 20, zIndex: 10 }}>
                        ramadan-companion.vercel.app
                    </div>
                </div>
            ),
            {
                width: 1200,
                height: 630,
            },
        );
    } catch (e: any) {
        console.log(`${e.message}`);
        return new Response(`Failed to generate the image`, {
            status: 500,
        });
    }
}
