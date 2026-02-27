export interface GamificationLevel {
    level: number;
    nameKey: string;
    descKey: string;
    minPoints: number;
    maxPoints: number | null; // null means infinity
}

export const GAMIFICATION_LEVELS: GamificationLevel[] = [
    { level: 1, nameKey: "1", descKey: "1", minPoints: 0, maxPoints: 499 },
    { level: 2, nameKey: "2", descKey: "2", minPoints: 500, maxPoints: 1499 },
    { level: 3, nameKey: "3", descKey: "3", minPoints: 1500, maxPoints: 2999 },
    { level: 4, nameKey: "4", descKey: "4", minPoints: 3000, maxPoints: 4999 },
    { level: 5, nameKey: "5", descKey: "5", minPoints: 5000, maxPoints: 7499 },
    { level: 6, nameKey: "6", descKey: "6", minPoints: 7500, maxPoints: 9999 },
    { level: 7, nameKey: "7", descKey: "7", minPoints: 10000, maxPoints: 14999 },
    { level: 8, nameKey: "8", descKey: "8", minPoints: 15000, maxPoints: null },
];

export function calculateUserLevel(seasonPoints: number): GamificationLevel {
    // Basic protection against negative values
    const safePoints = Math.max(0, seasonPoints);

    // Find the level where the points fall within the range
    const currentLevel = GAMIFICATION_LEVELS.find((lvl) => {
        if (lvl.maxPoints === null) return safePoints >= lvl.minPoints;
        return safePoints >= lvl.minPoints && safePoints <= lvl.maxPoints;
    });

    // Should theoretically never fall back, but just in case, return level 1
    return currentLevel || GAMIFICATION_LEVELS[0];
}

export function getNextLevel(currentLevel: number): GamificationLevel | null {
    if (currentLevel >= 8) return null; // Max level reached
    return GAMIFICATION_LEVELS.find((lvl) => lvl.level === currentLevel + 1) || null;
}
