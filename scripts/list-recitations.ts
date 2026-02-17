
const API_BASE_URL = 'https://api.quran.com/api/v4';

async function listRecitations() {
    const url = `${API_BASE_URL}/resources/recitations?language=en`;
    console.log(`Fetching: ${url}`);

    try {
        const response = await fetch(url);
        const data = await response.json();

        // Find Mishary
        const mishary = data.recitations.find((r: any) => r.reciter_name === 'Mishari Rashid al-`Afasy');
        console.log('Mishary Recitation Data:', JSON.stringify(mishary, null, 2));
    } catch (error) {
        console.error('Fetch error:', error);
    }
}

listRecitations();
