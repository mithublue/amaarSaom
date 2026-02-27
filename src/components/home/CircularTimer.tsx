'use client';

import React from 'react';

interface CircularTimerProps {
    value: string; // "HH:MM:SS"
    hourPercent: number; // 0 to 100 (Remaining)
    minutePercent: number; // 0 to 100 (Remaining)
    label: string;
    size?: 'sm' | 'lg';
    color?: 'emerald' | 'accent';
}

export default function CircularTimer({
    value,
    hourPercent,
    minutePercent,
    label,
    size = 'lg',
    color = 'emerald',
}: CircularTimerProps) {
    const isLarge = size === 'lg';

    // Outer Ring (Hours)
    const outerRadius = isLarge ? 104 : 54;
    const outerStroke = isLarge ? 7 : 4;
    const normalizedOuterRadius = outerRadius - outerStroke;
    const outerCircumference = normalizedOuterRadius * 2 * Math.PI;
    const outerOffset = outerCircumference - (hourPercent / 100) * outerCircumference;

    // Inner Ring (Minutes)
    const innerRadius = isLarge ? 88 : 45;
    const innerStroke = isLarge ? 7 : 4;
    const normalizedInnerRadius = innerRadius - innerStroke;
    const innerCircumference = normalizedInnerRadius * 2 * Math.PI;
    const innerOffset = innerCircumference - (minutePercent / 100) * innerCircumference;

    const colorClasses = {
        emerald: {
            outer: 'stroke-emerald-400',
            inner: 'stroke-emerald-600',
            glow: 'drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]',
            text: 'text-emerald-400',
            ringBg: 'text-emerald-500/10',
        },
        accent: {
            outer: 'stroke-accent-400',
            inner: 'stroke-accent-600',
            glow: 'drop-shadow-[0_0_8px_rgba(234,179,8,0.8)]',
            text: 'text-accent-400',
            ringBg: 'text-accent-500/10',
        },
    };

    const activeColor = colorClasses[color];

    return (
        <div className="flex flex-col items-center justify-center relative select-none">
            <div className={`relative flex items-center justify-center ${isLarge ? 'w-56 h-56' : 'w-28 h-28'}`}>

                {/* SVG Container */}
                <svg
                    height={outerRadius * 2}
                    width={outerRadius * 2}
                    className="transform -rotate-90"
                >
                    {/* Outer Ring Background */}
                    <circle
                        stroke="currentColor"
                        fill="transparent"
                        strokeWidth={outerStroke}
                        className={activeColor.ringBg}
                        r={normalizedOuterRadius}
                        cx={outerRadius}
                        cy={outerRadius}
                    />
                    {/* Outer Ring (Hours) */}
                    <circle
                        stroke="currentColor"
                        fill="transparent"
                        strokeWidth={outerStroke}
                        strokeDasharray={outerCircumference + ' ' + outerCircumference}
                        style={{ strokeDashoffset: outerOffset, transition: 'stroke-dashoffset 0.8s ease-out' }}
                        strokeLinecap="round"
                        className={`${activeColor.outer} ${activeColor.glow}`}
                        r={normalizedOuterRadius}
                        cx={outerRadius}
                        cy={outerRadius}
                    />

                    {/* Inner Ring Background */}
                    <circle
                        stroke="currentColor"
                        fill="transparent"
                        strokeWidth={innerStroke}
                        className={activeColor.ringBg}
                        r={normalizedInnerRadius}
                        cx={outerRadius}
                        cy={outerRadius}
                    />
                    {/* Inner Ring (Minutes) */}
                    <circle
                        stroke="currentColor"
                        fill="transparent"
                        strokeWidth={innerStroke}
                        strokeDasharray={innerCircumference + ' ' + innerCircumference}
                        style={{ strokeDashoffset: innerOffset, transition: 'stroke-dashoffset 0.8s ease-out' }}
                        strokeLinecap="round"
                        className={`${activeColor.inner} ${activeColor.glow}`}
                        r={normalizedInnerRadius}
                        cx={outerRadius}
                        cy={outerRadius}
                    />
                </svg>

                {/* Dynamic Text Content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                    {/* Main Label - Fixed overlapping by keeping it inside */}
                    <span className={`font-bold uppercase tracking-[0.2em] text-white/90 ${isLarge ? 'text-xl mb-2' : 'text-[9px] mb-1'}`}>
                        {label}
                    </span>

                    {/* Value - Time Text */}
                    <div className={`font-mono font-black text-white leading-none ${isLarge ? 'text-4xl md:text-5xl' : 'text-[12px] tracking-tighter'} drop-shadow-[0_0_12px_rgba(255,255,255,0.4)]`}>
                        {value}
                    </div>

                    {/* Sub-label */}
                    {isLarge && (
                        <span className="text-[10px] text-primary-300 mt-2 uppercase tracking-widest opacity-60">
                            Remaining
                        </span>
                    )}
                </div>
            </div>

            {/* Background Ambient Glow */}
            <div className={`absolute inset-0 rounded-full opacity-10 blur-3xl -z-10 ${color === 'emerald' ? 'bg-emerald-500' : 'bg-accent-500'}`} />
        </div>
    );
}
