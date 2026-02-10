
async function check() {
    const username = 'neal_wu';
    console.log('--- Alfa API (Solved) ---');
    try {
        const res = await fetch(`https://alfa-leetcode-api.onrender.com/${username}/solved`);
        const data = await res.json();
        console.log('Alfa Solved:', JSON.stringify(data, null, 2));
    } catch (e) {
        console.log('Alfa Solved API failed:', e.message);
    }
}
check();
