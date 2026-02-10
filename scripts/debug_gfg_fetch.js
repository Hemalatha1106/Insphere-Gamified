const fs = require('fs');

async function run() {
    const username = 'shubham';
    const url = `https://www.geeksforgeeks.org/user/${username}/`;

    console.log(`Fetching ${url}...`);

    try {
        const res = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        console.log('Status:', res.status);
        console.log('Final URL:', res.url);

        const text = await res.text();
        fs.writeFileSync('gfg_dump.html', text);
        console.log('Saved to gfg_dump.html');

        // Quick regex check
        const solvedMatch = text.match(/Problems Solved\s*:{0,1}\s*(\d+)/i) || text.match(/>Problems Solved<[^>]*>(\d+)</i);
        console.log('Match attempt:', solvedMatch ? solvedMatch[1] : 'null');

    } catch (e) {
        console.error('Fetch error:', e);
    }
}

run();
