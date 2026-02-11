const https = require('https');

const username = 'Hemalatha1106'; // Example user
const url = `https://alfa-leetcode-api.onrender.com/${username}/solved`;

https.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        console.log('Solved Endpoint:', JSON.parse(data));
    });
});

const url2 = `https://alfa-leetcode-api.onrender.com/${username}`;
https.get(url2, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        console.log('Profile Endpoint:', JSON.parse(data));
    });
});
