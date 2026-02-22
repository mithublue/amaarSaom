/**
 * Prayer Scheduler Utility
 * Fetches prayer times from Aladhan API and determines which prayer
 * is currently 15-20 minutes past, for push notification timing.
 */

export const PRAYER_NAMES = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'] as const;
export type PrayerName = typeof PRAYER_NAMES[number];

/** Multilingual post-prayer dhikr reminders */
const PRAYER_MESSAGES: Record<PrayerName, Record<string, { title: string; body: string }>> = {
    Fajr: {
        en: { title: '🕌 Fajr Prayer Reminder', body: 'Have you prayed Fajr? Take a moment for morning Adhkar — Subhanallah 33×, Alhamdulillah 33×, Allahu Akbar 34×.' },
        bn: { title: '🕌 ফজরের নামাজ স্মরণিকা', body: 'ফজর পড়েছেন? এখন সকালের আজকার পড়ুন — সুবহানাল্লাহ ৩৩×, আলহামদুলিল্লাহ ৩৩×, আল্লাহু আকবার ৩৪×।' },
        ar: { title: '🕌 تذكير صلاة الفجر', body: 'هل صليت الفجر؟ اقرأ أذكار الصباح — سبحان الله ٣٣×، الحمد لله ٣٣×، الله أكبر ٣٤×.' },
    },
    Dhuhr: {
        en: { title: '🕌 Dhuhr Prayer Reminder', body: 'Time for post-Dhuhr Dhikr! Recite Subhanallah 33×, Alhamdulillah 33×, Allahu Akbar 34×.' },
        bn: { title: '🕌 জোহরের নামাজ স্মরণিকা', body: 'জোহরের পরের যিকির করুন! সুবহানাল্লাহ ৩৩×, আলহামদুলিল্লাহ ৩৩×, আল্লাহু আকবার ৩৪×।' },
        ar: { title: '🕌 تذكير صلاة الظهر', body: 'اقرأ أذكار بعد صلاة الظهر — سبحان الله ٣٣×، الحمد لله ٣٣×، الله أكبر ٣٤×.' },
    },
    Asr: {
        en: { title: '🕌 Asr Prayer Reminder', body: 'Have you prayed Asr? Read your post-prayer adhkar and make dua before Maghrib.' },
        bn: { title: '🕌 আসরের নামাজ স্মরণিকা', body: 'আসর পড়েছেন? মাগরিবের আগে দোয়া করুন, নামাজের পরের আজকার পড়ুন।' },
        ar: { title: '🕌 تذكير صلاة العصر', body: 'هل صليت العصر؟ اقرأ الأذكار وادع الله قبل المغرب.' },
    },
    Maghrib: {
        en: { title: '🕌 Maghrib Prayer Reminder', body: 'Have you prayed Maghrib? Read evening Adhkar — Ayatul Kursi & last 2 Surahs of Al-Hashr.' },
        bn: { title: '🕌 মাগরিবের নামাজ স্মরণিকা', body: 'মাগরিব পড়েছেন? সন্ধ্যার আজকার পড়ুন — আয়াতুল কুরসি ও সূরা হাশরের শেষ ৩ আয়াত।' },
        ar: { title: '🕌 تذكير صلاة المغرب', body: 'هل صليت المغرب؟ اقرأ أذكار المساء — آية الكرسي وآخر سورة الحشر.' },
    },
    Isha: {
        en: { title: '🕌 Isha Prayer Reminder', body: 'Have you prayed Isha? Read your night Adhkar and recite Surah Al-Mulk before sleeping.' },
        bn: { title: '🕌 ইশার নামাজ স্মরণিকা', body: 'ইশা পড়েছেন? রাতের আজকার পড়ুন এবং ঘুমানোর আগে সূরা মুলক পড়ুন।' },
        ar: { title: '🕌 تذكير صلاة العشاء', body: 'هل صليت العشاء؟ اقرأ أذكار النوم وسورة الملك قبل النوم.' },
    },
};

/** Parse "HH:MM" time string into minutes since midnight */
function parseTimeToMinutes(timeStr: string): number {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
}

/** Get current time in minutes since midnight for a given timezone */
function nowInTimezone(tz: string): number {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: tz,
        hour: 'numeric',
        minute: 'numeric',
        hour12: false,
    });
    const parts = formatter.formatToParts(now);
    const h = parseInt(parts.find(p => p.type === 'hour')?.value ?? '0');
    const m = parseInt(parts.find(p => p.type === 'minute')?.value ?? '0');
    return h * 60 + m;
}

/** Fetch prayer times for a given city+country from Aladhan */
export async function fetchPrayerTimes(
    city: string,
    country: string
): Promise<Record<PrayerName, string> | null> {
    try {
        const url = `https://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}&method=1`;
        const res = await fetch(url, { next: { revalidate: 3600 } });
        if (!res.ok) return null;
        const data = await res.json();
        const t = data?.data?.timings;
        if (!t) return null;
        return {
            Fajr: t.Fajr,
            Dhuhr: t.Dhuhr,
            Asr: t.Asr,
            Maghrib: t.Maghrib,
            Isha: t.Isha,
        };
    } catch {
        return null;
    }
}

/**
 * Determine if a prayer is currently 15-20 minutes past.
 * Returns the prayer name if a reminder should be sent, otherwise null.
 */
export function getPrayerToRemind(
    prayerTimes: Record<PrayerName, string>,
    timezone: string,
    windowMinLow = 15,
    windowMinHigh = 22,
): PrayerName | null {
    const nowMin = nowInTimezone(timezone);
    for (const prayer of PRAYER_NAMES) {
        const prayerMin = parseTimeToMinutes(prayerTimes[prayer]);
        const diff = nowMin - prayerMin;
        if (diff >= windowMinLow && diff <= windowMinHigh) {
            return prayer;
        }
    }
    return null;
}

/** Get the notification payload for a given prayer and language */
export function getPrayerNotificationText(
    prayer: PrayerName,
    lang: string
): { title: string; body: string } {
    const l = ['en', 'bn', 'ar'].includes(lang) ? lang : 'en';
    return PRAYER_MESSAGES[prayer][l];
}
