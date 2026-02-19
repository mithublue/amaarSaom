
const axios = require('axios');

async function checkDate() {
    // 19 Feb 2026
    const date = '19-02-2026';

    // BD - Method 1
    const urlBD = `https://api.aladhan.com/v1/timingsByCity?city=Dhaka&country=Bangladesh&method=1&date=${date}`;
    // Saudi - Method 4
    const urlSA = `https://api.aladhan.com/v1/timingsByCity?city=Mecca&country=Saudi%20Arabia&method=4&date=${date}`;

    try {
        const resBD = await axios.get(urlBD);
        const resSA = await axios.get(urlSA);

        console.log('--- Bangladesh (Method 1) ---');
        console.log('Hijri:', resBD.data.data.date.hijri.date);
        console.log('Day:', resBD.data.data.date.hijri.day);
        console.log('Month:', resBD.data.data.date.hijri.month.en);

        console.log('\n--- Saudi Arabia (Method 4) ---');
        console.log('Hijri:', resSA.data.data.date.hijri.date);
        console.log('Day:', resSA.data.data.date.hijri.day);
        console.log('Month:', resSA.data.data.date.hijri.month.en);
    } catch (e) {
        console.error(e);
    }
}

checkDate();
