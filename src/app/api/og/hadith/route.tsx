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
                        backgroundColor: '#022C22', // primary-950
                        backgroundImage: 'radial-gradient(circle at 25px 25px, rgba(255, 255, 255, 0.05) 2%, transparent 0%), radial-gradient(circle at 75px 75px, rgba(255, 255, 255, 0.05) 2%, transparent 0%)',
                        backgroundSize: '100px 100px',
                        fontFamily: 'serif',
                        color: 'white',
                        padding: '40px',
                        position: 'relative',
                    }}
                >
                    {/* Decoration */}
                    <div style={{ position: 'absolute', top: 40, left: 40, display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ fontSize: 40 }}>🌙</div>
                        <div style={{ color: '#F59E0B', fontSize: 24, letterSpacing: 4, fontWeight: 'bold' }}>RAMADAN COMPANION</div>
                    </div>

                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textAlign: 'center',
                        backgroundColor: 'rgba(6, 78, 59, 0.5)', // primary-900/50
                        borderRadius: 20,
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        padding: '60px',
                        width: '90%',
                        boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                    }}>
                        <div style={{ fontSize: 60, marginBottom: 20, opacity: 0.2 }}>❝</div>

                        <div style={{
                            fontSize: text.length > 200 ? 32 : 40,
                            lineHeight: 1.6,
                            marginBottom: 40,
                            textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                            maxWidth: '90%',
                            wordWrap: 'break-word',
                        }}>
                            {text}
                        </div>

                        <div style={{
                            width: 100,
                            height: 4,
                            background: 'linear-gradient(90deg, transparent, #F59E0B, transparent)',
                            marginBottom: 20
                        }}></div>

                        <div style={{
                            color: '#FCD34D', // accent-300
                            fontSize: 24,
                            fontWeight: 'bold',
                            letterSpacing: 2,
                            textTransform: 'uppercase'
                        }}>
                            — {source}
                        </div>
                    </div>

                    <div style={{ position: 'absolute', bottom: 40, opacity: 0.6, fontSize: 18 }}>
                        Read more at ramadan-companion.vercel.app
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
