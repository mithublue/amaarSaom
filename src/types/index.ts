// NextAuth types extension
import 'next-auth';

declare module 'next-auth' {
    interface Session {
        user: {
            id: string;
            name?: string | null;
            email?: string | null;
            image?: string | null;
            districtId?: number | null;
            divisionId?: number | null;
            countryId?: number | null;
            language?: string | null;
        };
    }

    interface User {
        id: string;
        name?: string | null;
        email?: string | null;
        image?: string | null;
        districtId?: number | null;
        divisionId?: number | null;
        countryId?: number | null;
        language?: string | null;
    }
}

// API Response Types
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

// Prayer Times
export interface PrayerTimesData {
    date: string;
    hijriDate: string;
    hijriMonth: string;
    hijriYear: number;
    gregorianDate: string;
    timings: {
        fajr: string;
        dhuhr: string;
        asr: string;
        maghrib: string;
        isha: string;
        sunrise: string;
        sunset: string;
        imsak: string;
        midnight: string;
    };
    nextPrayer: 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';
    timeUntilNext: number;
    countdowns?: {
        iftar: number | null;
        sahri: number | null;
    };
}

// Good Deeds
export interface PredefinedGoodDeed {
    id: number;
    nameEn: string;
    nameBn?: string | null;
    nameAr?: string | null;
    category: string;
    tier: 'easy' | 'medium' | 'hard';
    points: number;
    timeEstimateMinutes: number;
    icon?: string | null;
    descriptionEn?: string | null;
    descriptionBn?: string | null;
    descriptionAr?: string | null;
}

export interface CompletedDeed {
    id: number;
    userId: number;
    goodDeedId?: number | null;
    customDeedName?: string | null;
    basePoints: number;
    bonusPoints: number;
    multiplier: number;
    totalPoints: number;
    date: Date;
    completedAt: Date;
    notes?: string | null;
    isStreakBonus: boolean;
    isPowerDay: boolean;
    goodDeed?: PredefinedGoodDeed | null;
}

// Goals
export interface UserGoal {
    id: number;
    userId: number;
    goodDeedId?: number | null;
    customDeedName?: string | null;
    goalType: 'daily' | 'weekly' | 'monthly';
    targetCount: number;
    currentCount: number;
    startDate: Date;
    endDate: Date;
    isCompleted: boolean;
    createdAt: Date;
    goodDeed?: PredefinedGoodDeed | null;
}

// Leaderboard
export interface LeaderboardEntry {
    rank: number;
    userId: number;
    userName: string;
    userImage?: string;
    totalPoints: number;
    location?: string;
}

export interface LeaderboardData {
    entries: LeaderboardEntry[];
    userRank?: LeaderboardEntry;
    totalUsers: number;
}

// Locations
export interface Country {
    id: number;
    nameEn: string;
    nameBn?: string | null;
    nameAr?: string | null;
    code: string;
}

export interface Division {
    id: number;
    nameEn: string;
    nameBn?: string | null;
    nameAr?: string | null;
    countryId: number;
}

export interface District {
    id: number;
    nameEn: string;
    nameBn?: string | null;
    latitude: number;
    longitude: number;
    divisionId: number;
}

// User Profile
export interface UserProfile {
    id: number;
    name: string;
    email: string;
    image?: string | null;
    districtId?: number | null;
    divisionId?: number | null;
    countryId?: number | null;
    language: string;
    emailVerified?: Date | null;
    district?: District;
    division?: Division;
    country?: Country;
}
