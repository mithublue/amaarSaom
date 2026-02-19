
const axios = require('axios');

async function checkDateFormat() {
    const wrongFormat = '2026-02-19'; // YYYY-MM-DD
    const correctFormat = '19-02-2026'; // DD-MM-YYYY

    const urlWrong = `https://api.aladhan.com/v1/timingsByCity?city=Mecca&country=Saudi%20Arabia&method=4&date=${wrongFormat}`;
    const urlCorrect = `https://api.aladhan.com/v1/timingsByCity?city=Mecca&country=Saudi%20Arabia&method=4&date=${correctFormat}`;

    try {
        console.log('Fetching with Wrong Format (YYYY-MM-DD)...');
        const resWrong = await axios.get(urlWrong);
        console.log('Result:', resWrong.data.data.date.readable, '- Hijri:', resWrong.data.data.date.hijri.date, 'Day:', resWrong.data.data.date.hijri.day);

        console.log('\nFetching with Correct Format (DD-MM-YYYY)...');
        const resCorrect = await axios.get(urlCorrect);
        console.log('Result:', resCorrect.data.data.date.readable, '- Hijri:', resCorrect.data.data.date.hijri.date, 'Day:', resCorrect.data.data.date.hijri.day);
    } catch (e) {
        console.error('Error:', e.message);
    }
}

checkDateFormat();
