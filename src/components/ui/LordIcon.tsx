'use client';

import { useEffect, useState } from 'react';
import { Player } from '@lordicon/react';

interface LordIconProps {
    src: string;
    size?: number;
    colors?: string;
    className?: string;
    trigger?: 'hover' | 'click' | 'loop' | 'loop-on-hover';
}

export default function LordIcon({ src, size = 24, colors = "primary:#10b981,secondary:#ffffff", className = "", trigger = 'hover' }: LordIconProps) {
    const [iconData, setIconData] = useState<any>(null);
    const [playerRef, setPlayerRef] = useState<Player | null>(null);

    useEffect(() => {
        fetch(`/icons/${src}.json`)
            .then(res => res.json())
            .then(data => setIconData(data))
            .catch(err => console.error("Error loading lordicon", err));
    }, [src]);

    useEffect(() => {
        if (playerRef && trigger === 'loop') {
            playerRef.playFromBeginning();
        }
    }, [playerRef, trigger]);

    if (!iconData) return <div style={{ width: size, height: size }} className={`animate-pulse bg-white/5 rounded-md ${className}`}></div>;

    return (
        <div
            className={`inline-block ${className}`}
            onMouseEnter={() => trigger === 'hover' && playerRef?.playFromBeginning()}
            onClick={() => trigger === 'click' && playerRef?.playFromBeginning()}
        >
            <Player
                ref={setPlayerRef}
                icon={iconData}
                size={size}
                colors={colors}
                onComplete={() => {
                    if (trigger === 'loop' || trigger === 'loop-on-hover') {
                        setTimeout(() => playerRef?.playFromBeginning(), 1000);
                    }
                }}
            />
        </div>
    );
}
