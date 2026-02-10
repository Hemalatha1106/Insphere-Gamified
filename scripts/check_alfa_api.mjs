
async function check() {
    const username = 'neal_wu';

    console.log('--- Alfa API (General) ---');
    try {
        // Checking if Alfa API supports user profile
        const res = await fetch(`https://alfa-leetcode-api.onrender.com/${username}`);
        if (!res.ok) throw new Error(`Status: ${res.status}`);
        const data = await res.json();
        console.log('Alfa General:', JSON.stringify(data, null, 2));
    } catch (e) {
        console.log('Alfa General API failed:', e.message);
    }
}
check();
