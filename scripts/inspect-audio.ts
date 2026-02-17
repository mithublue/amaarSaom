
const API_BASE_URL = 'https://api.quran.com/api/v4';
const id = 1; // Al-Fatihah, short
const translations = '131';

async function inspectAudio() {
    const url = `${API_BASE_URL}/verses/by_chapter/${id}?language=en&words=false&translations=${translations}&recitation=7&page=1&per_page=3&fields=text_uthmani,audio`;

    console.log(`Fetching: ${url}`);

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.verses && data.verses.length > 0) {
            console.log('Keys:', Object.keys(data.verses[0]));
            if (data.verses[0].audio_url) console.log('Found audio_url:', data.verses[0].audio_url);
            if (data.verses[0].audio) console.log('Found audio object:', JSON.stringify(data.verses[0].audio));
        } else {
            console.log('No verses found');
        }
    } catch (error) {
        console.error('Fetch error:', error);
    }
}

inspectAudio();
