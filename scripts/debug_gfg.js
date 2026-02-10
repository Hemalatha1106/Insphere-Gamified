const https = require('https');
const fs = require('fs');

const username = 'shubham';
const url = `https://www.geeksforgeeks.org/user/${username}/`;

console.log(`Fetching ${url}...`);

https.get(url, {
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
}, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        console.log('Status Code:', res.statusCode);
        fs.writeFileSync('gfg_dump.html', data);
        console.log('Saved to gfg_dump.html');
    });

}).on('error', (err) => {
    console.error('Error:', err.message);
});
