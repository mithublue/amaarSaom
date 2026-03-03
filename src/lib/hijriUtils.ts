/**
 * Hijri Calendar Utilities
 * Uses the built-in Intl.DateTimeFormat API with islamic calendar support.
 * No external dependencies required.
 */

/**
 * Returns a human-readable string for the current Hijri month and year.
 * Example: "Ramadan 1447" or "Sha'ban 1447"
 */
export function getCurrentHijriMonth(): string {
    const now = new Date();
    try {
        const hijriFormatter = new Intl.DateTimeFormat('en-u-ca-islamic', {
            month: 'long',
            year: 'numeric',
        });
        // format returns something like "Ramadan 1447 AH" — strip the AH
        return hijriFormatter.format(now).replace(' AH', '').trim();
    } catch {
        // Fallback: return a generic key based on Gregorian month
        const gregorianMonths = [
            'Rajab', 'Sha\'ban', 'Ramadan', 'Shawwal', 'Dhu al-Qi\'dah', 'Dhu al-Hijjah',
            'Muharram', 'Safar', 'Rabi al-Awwal', 'Rabi al-Thani', 'Jumada al-Awwal', 'Jumada al-Thani'
        ];
        const hijriYear = now.getFullYear() - 579; // rough approximation
        return `${gregorianMonths[now.getMonth()]} ${hijriYear}`;
    }
}

/**
 * Returns the Hijri month for a specific date.
 */
export function getHijriMonthForDate(date: Date): string {
    try {
        const hijriFormatter = new Intl.DateTimeFormat('en-u-ca-islamic', {
            month: 'long',
            year: 'numeric',
        });
        return hijriFormatter.format(date).replace(' AH', '').trim();
    } catch {
        return getCurrentHijriMonth();
    }
}

/**
 * Returns whether a given date is a Friday (Jumu'ah) — Boss Day.
 */
export function isFriday(date: Date = new Date()): boolean {
    return date.getDay() === 5;
}
