
async function check() {
    const username = 'neal_wu';
    try {
        const res = await fetch(`https://alfa-leetcode-api.onrender.com/${username}/solved`);
        const data = await res.json();
        console.log('Solved Data:', JSON.stringify(data, null, 2));
    } catch (e) { console.log('Error:', e.message); }
}
check();
