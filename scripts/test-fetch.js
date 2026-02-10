// scripts/test-fetch.js
// using native fetch


async function testFetch(username, platform) {
    console.log(`Testing ${platform} for ${username}...`);
    try {
        if (platform === 'leetcode') {
            const res = await fetch(`https://leetcode-stats-api.herokuapp.com/${username}`);
            const data = await res.text();
            console.log('LeetCode Status:', res.status);
            console.log('LeetCode Data Preview:', data.substring(0, 200));
        } else if (platform === 'github') {
            const res = await fetch(`https://api.github.com/users/${username}`);
            const data = await res.json();
            console.log('GitHub Basic Status:', res.status);
            if (res.ok) console.log('GitHub Repos:', data.public_repos);

            const contribRes = await fetch(`https://github-contributions-api.jogruber.de/v4/${username}?y=last`);
            console.log('GitHub Contrib Status:', contribRes.status);
        } else if (platform === 'codeforces') {
            const res = await fetch(`https://codeforces.com/api/user.info?handles=${username}`);
            const data = await res.json();
            console.log('Codeforces Info Status:', res.status);
            console.log('Codeforces Info:', JSON.stringify(data).substring(0, 200));

            const statusRes = await fetch(`https://codeforces.com/api/user.status?handle=${username}&from=1&count=10`);
            console.log('Codeforces Status Status:', statusRes.status);
        }
    } catch (e) {
        console.error(`Error fetching ${platform}:`, e);
    }
    console.log('-----------------------------------');
}

// Extract usernames from user provided URLs
// LeetCode: Hemalatha_Venkatesan
// GitHub: Hemalatha1106
// Codeforces: Hemalatha_Venkatesan

(async () => {
    await testFetch('Hemalatha_Venkatesan', 'leetcode');
    await testFetch('Hemalatha1106', 'github');
    await testFetch('Hemalatha_Venkatesan', 'codeforces');
})();
