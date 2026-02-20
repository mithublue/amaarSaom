import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);

        // ?title=<title>
        const hasTitle = searchParams.has('title');
        const title = hasTitle
            ? searchParams.get('title')?.slice(0, 100)
            : 'Nuzul';

        // ?desc=<desc>
        const hasDesc = searchParams.has('desc');
        const desc = hasDesc
            ? searchParams.get('desc')?.slice(0, 200)
            : 'Your spiritual guide for the holy month';

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
                        backgroundColor: '#022c22', // primary-950
                        color: 'white',
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: '#064e3b', // primary-900 with opacity
                            borderRadius: '20px',
                            padding: '40px',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            width: '80%',
                            height: '80%',
                        }}
                    >
                        <div style={{ fontSize: 60, fontStyle: 'normal', letterSpacing: '-0.025em', color: 'white', marginTop: 30, padding: '0 120px', lineHeight: 1.4, whiteSpace: 'pre-wrap' }}>
                            {title}
                        </div>
                        <div style={{ fontSize: 30, fontStyle: 'normal', letterSpacing: '-0.025em', color: '#d1fae5', marginTop: 30, padding: '0 120px', lineHeight: 1.4, whiteSpace: 'pre-wrap' }}>
                            {desc}
                        </div>
                    </div>
                </div>
            ),
            {
                width: 1200,
                height: 630,
            }
        );
    } catch (e: any) {
        return new Response(`Failed to generate the image`, {
            status: 500,
        });
    }
}
