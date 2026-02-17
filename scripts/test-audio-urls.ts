
import https from 'https';

const urls = [
    'https://verses.quran.com/Alafasy/001001.mp3',
    'https://verses.quran.com/Alafasy/mp3/001001.mp3',
    'https://download.quranicaudio.com/quran/mishaari_raashid_al_3afaasee/001001.mp3',
    'https://mirrors.quranicaudio.com/everyayah/Alafasy_128kbps/001001.mp3',
    'https://media.qurancentral.com/mishary-rashid-alafasy/mishary-rashid-alafasy-128kbps/001001.mp3'
];

async function checkUrl(url: string) {
    return new Promise((resolve) => {
        const req = https.request(url, { method: 'HEAD' }, (res) => {
            console.log(`${res.statusCode} - ${url}`);
            resolve(res.statusCode === 200);
        });

        req.on('error', (e) => {
            console.log(`Error - ${url}: ${e.message}`);
            resolve(false);
        });

        req.end();
    });
}

async function runTests() {
    console.log('Testing Audio URLs for 1:1 (001001.mp3)...');
    for (const url of urls) {
        await checkUrl(url);
    }
}

runTests();
