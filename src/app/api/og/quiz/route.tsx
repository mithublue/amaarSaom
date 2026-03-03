import { ImageResponse } from 'next/og';

export const runtime = 'edge';

/**
 * GET /api/og/quiz?score=280&streak=12&rank=5&name=Mithu&correct=3&total=3
 * Returns a branded 1200x630 OG image for quiz result sharing.
 */
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);

        const score = searchParams.get('score') ?? '0';
        const streak = searchParams.get('streak') ?? '0';
        const rank = searchParams.get('rank') ?? '-';
        const name = (searchParams.get('name') ?? 'A Muslim').slice(0, 30);
        const correct = searchParams.get('correct') ?? '0';
        const total = searchParams.get('total') ?? '3';

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
                        backgroundColor: '#020617', // slate-950
                        fontFamily: 'sans-serif',
                    }}
                >
                    {/* Background glow blobs */}
                    <div style={{
                        position: 'absolute', top: -80, left: -80,
                        width: 500, height: 500,
                        borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(37,99,235,0.25) 0%, transparent 70%)',
                        display: 'flex',
                    }} />
                    <div style={{
                        position: 'absolute', bottom: -80, right: -80,
                        width: 500, height: 500,
                        borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(124,58,237,0.25) 0%, transparent 70%)',
                        display: 'flex',
                    }} />

                    {/* Card */}
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'linear-gradient(135deg, rgba(37,99,235,0.15) 0%, rgba(124,58,237,0.15) 100%)',
                        border: '1.5px solid rgba(99,102,241,0.4)',
                        borderRadius: 32,
                        padding: '52px 72px',
                        width: '82%',
                        gap: 0,
                    }}>
                        {/* Header */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
                            <div style={{ fontSize: 46 }}>🧠</div>
                            <div style={{ color: '#a5b4fc', fontSize: 28, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase' }}>
                                Daily Islamic Quiz
                            </div>
                        </div>

                        {/* Player name */}
                        <div style={{ color: 'white', fontSize: 42, fontWeight: 800, marginBottom: 36 }}>
                            {name}
                        </div>

                        {/* Score row */}
                        <div style={{ display: 'flex', gap: 48, marginBottom: 32 }}>
                            {/* Final Score */}
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <div style={{ color: '#818cf8', fontSize: 20, fontWeight: 600, marginBottom: 6 }}>SCORE</div>
                                <div style={{
                                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                    borderRadius: 16, padding: '10px 28px',
                                    color: 'white', fontSize: 52, fontWeight: 900,
                                }}>
                                    {score}
                                </div>
                            </div>

                            {/* Streak */}
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <div style={{ color: '#fb923c', fontSize: 20, fontWeight: 600, marginBottom: 6 }}>STREAK</div>
                                <div style={{
                                    background: 'rgba(251,146,60,0.15)',
                                    border: '1.5px solid rgba(251,146,60,0.4)',
                                    borderRadius: 16, padding: '10px 28px',
                                    color: '#fdba74', fontSize: 52, fontWeight: 900,
                                }}>
                                    🔥 {streak}
                                </div>
                            </div>

                            {/* Correct */}
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <div style={{ color: '#4ade80', fontSize: 20, fontWeight: 600, marginBottom: 6 }}>CORRECT</div>
                                <div style={{
                                    background: 'rgba(74,222,128,0.1)',
                                    border: '1.5px solid rgba(74,222,128,0.35)',
                                    borderRadius: 16, padding: '10px 28px',
                                    color: '#86efac', fontSize: 52, fontWeight: 900,
                                }}>
                                    ✅ {correct}/{total}
                                </div>
                            </div>
                        </div>

                        {/* Rank + CTA */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                            {rank !== '-' && (
                                <div style={{ color: '#fbbf24', fontSize: 26, fontWeight: 700 }}>
                                    🏆 Rank #{rank} in Community
                                </div>
                            )}
                            <div style={{
                                color: '#6b7280',
                                fontSize: 22,
                                marginTop: 8,
                            }}>
                                Can you beat me? → nuzul.xyz
                            </div>
                        </div>
                    </div>
                </div>
            ),
            { width: 1200, height: 630 }
        );
    } catch (e: any) {
        console.error('[og/quiz] Error:', e);
        return new Response('Failed to generate image', { status: 500 });
    }
}
