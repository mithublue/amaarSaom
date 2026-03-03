const fs = require('fs');

const arPath = 'messages/ar.json';
const bnPath = 'messages/bn.json';
const enPath = 'messages/en.json';

function getReplacement(lang) {
    const quizObj = {
        title: lang === 'ar' ? 'معركة الذكاء' : (lang === 'bn' ? 'দৈনিক কুইজ' : 'Brain Battle'),
        titleBn: lang === 'ar' ? 'مسابقة يومية' : (lang === 'bn' ? 'ব্রেইন-ব্যাটল' : 'Daily Quiz'),
        startQuiz: lang === 'ar' ? 'ابدأ المسابقة' : (lang === 'bn' ? 'কুইজ শুরু করুন' : 'Start Quiz'),
        question: lang === 'ar' ? 'سؤال' : (lang === 'bn' ? 'প্রশ্ন' : 'Question'),
        of: lang === 'ar' ? 'من' : (lang === 'bn' ? 'এর' : 'of'),
        timeUp: lang === 'ar' ? 'انتهى الوقت!' : (lang === 'bn' ? 'সময় শেষ!' : 'Time\'s Up!'),
        correct: lang === 'ar' ? 'إجابة صحيحة!' : (lang === 'bn' ? 'সঠিক উত্তর!' : 'Correct!'),
        wrong: lang === 'ar' ? 'إجابة خاطئة!' : (lang === 'bn' ? 'ভুল উত্তর!' : 'Wrong!'),
        explanation: lang === 'ar' ? 'الشرح' : (lang === 'bn' ? 'ব্যাখ্যা' : 'Explanation'),
        nextQuestion: lang === 'ar' ? 'السؤال التالي' : (lang === 'bn' ? 'পরবর্তী প্রশ্ন' : 'Next Question'),
        results: lang === 'ar' ? 'النتائج' : (lang === 'bn' ? 'ফলাফল' : 'Results'),
        yourScore: lang === 'ar' ? 'درجتك' : (lang === 'bn' ? 'আপনার স্কোর' : 'Your Score'),
        streakMultiplier: lang === 'ar' ? 'مضاعف الاستمرار' : (lang === 'bn' ? 'স্ট্রিক মাল্টিপ্লায়ার' : 'Streak Multiplier'),
        finalScore: lang === 'ar' ? 'الدرجة النهائية' : (lang === 'bn' ? 'চূড়ান্ত স্কোর' : 'Final Score'),
        streak: lang === 'ar' ? 'استمرار الأيام' : (lang === 'bn' ? 'দিনের স্ট্রিক' : 'Day Streak'),
        shareResult: lang === 'ar' ? 'مشاركة النتيجة' : (lang === 'bn' ? 'ফলাফল শেয়ার করুন' : 'Share Result'),
        alreadyPlayed: lang === 'ar' ? 'لقد لعبت اليوم بالفعل!' : (lang === 'bn' ? 'আপনি আজকে কুইজ খেলে ফেলেছেন!' : 'You\'ve already played today!'),
        comeBackTomorrow: lang === 'ar' ? 'عد غدًا!' : (lang === 'bn' ? 'আগামীকাল আবার খেলুন!' : 'Come back tomorrow!'),
        bossDayTitle: lang === 'ar' ? 'تحدي الجمعة!' : (lang === 'bn' ? 'জুমুআহ বস চ্যালেঞ্জ!' : 'Jumu\'ah Boss Challenge!'),
        bossDayDesc: lang === 'ar' ? '5 أسئلة أصعب، 3 أضعاف النقاط!' : (lang === 'bn' ? '৫টি কঠিন প্রশ্ন, ৩ গুণ পয়েন্ট!' : '5 harder questions, 3x points!'),
        lifeline5050: lang === 'ar' ? '50/50' : (lang === 'bn' ? '৫০/৫০ লাইফলাইন' : '50/50'),
        streakSaver: lang === 'ar' ? 'حفظ الاستمرار' : (lang === 'bn' ? 'স্ট্রিক সেভার' : 'Streak Saver'),
        buy5050: lang === 'ar' ? 'شراء 50/50 (200 نقطة)' : (lang === 'bn' ? 'কিনুন ৫০/৫০ (২০০ পয়েন্ট)' : 'Buy 50/50 (200 pts)'),
        buyStreakSaver: lang === 'ar' ? 'شراء حفظ (500 نقطة)' : (lang === 'bn' ? 'কিনুন স্ট্রিক সেভার (৫০০ পয়েন্ট)' : 'Buy Streak Saver (500 pts)'),
        quizMasters: lang === 'ar' ? 'أبطال المسابقة' : (lang === 'bn' ? 'কুইজ মাস্টার্স' : 'Quiz Masters'),
        playNow: lang === 'ar' ? 'العب الآن' : (lang === 'bn' ? 'এখনই খেলুন' : 'Play Now'),
        todayScore: lang === 'ar' ? 'درجة اليوم' : (lang === 'bn' ? 'আজকের স্কোর' : 'Today\'s Score'),
        protectStreak: lang === 'ar' ? 'احمِ استمرارك!' : (lang === 'bn' ? 'আপনার স্ট্রিক ধরে রাখুন!' : 'Protect your streak!')
    };
    return quizObj;
}

function processFile(filePath, lang) {
    const content = fs.readFileSync(filePath, 'utf8');
    let data = JSON.parse(content);
    data.quiz = getReplacement(lang);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 4), 'utf8');
    console.log(`Updated ${filePath}`);
}

processFile(arPath, 'ar');
processFile(bnPath, 'bn');
processFile(enPath, 'en');
