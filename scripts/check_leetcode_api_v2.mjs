

async function check() {
    const username = 'neal_wu';
    const timeout = 5000;

    console.log(`Checking stats for: ${username}`);

    console.log('\n--- 1. Heroku API ---');
    try {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), timeout);
        const start = Date.now();
        const res1 = await fetch(`https://leetcode-stats-api.herokuapp.com/${username}`, { signal: controller.signal });
        clearTimeout(id);
        console.log(`Status: ${res1.status} (${Date.now() - start}ms)`);
        if (res1.ok) {
            const data1 = await res1.json();
            console.log('Success. Keys:', Object.keys(data1));
            console.log('Solved:', data1.totalSolved);
        } else {
            console.log('Failed:', res1.statusText);
        }
    } catch (e) {
        console.log('Heroku API Error:', e.message);
    }

    console.log('\n--- 2. Alfa API (Solved) ---');
    try {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), timeout);
        const start = Date.now();
        const res2 = await fetch(`https://alfa-leetcode-api.onrender.com/${username}/solved`, { signal: controller.signal });
        clearTimeout(id);
        console.log(`Status: ${res2.status} (${Date.now() - start}ms)`);
        if (res2.ok) {
            const data2 = await res2.json();
            console.log('Success. Data:', JSON.stringify(data2));
        } else {
            const text = await res2.text();
            console.log('Failed:', res2.statusText, text.substring(0, 100));
        }
    } catch (e) {
        console.log('Alfa API Error:', e.message);
    }

    console.log('\n--- 3. Alfa API (Profile) ---');
    try {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), timeout);
        const start = Date.now();
        const res3 = await fetch(`https://alfa-leetcode-api.onrender.com/${username}`, { signal: controller.signal });
        clearTimeout(id);
        console.log(`Status: ${res3.status} (${Date.now() - start}ms)`);
        if (res3.ok) {
            const data3 = await res3.json();
            console.log('Success. Ranking:', data3.ranking);
        }
    } catch (e) {
        console.log('Alfa Profile Error:', e.message);
    }

    console.log('\n--- 4. FaisalShohag API ---');
    try {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), timeout);
        const start = Date.now();
        const res4 = await fetch(`https://leetcode-api-faisalshohag.vercel.app/${username}`, { signal: controller.signal });
        clearTimeout(id);
        console.log(`Status: ${res4.status} (${Date.now() - start}ms)`);
        if (res4.ok) {
            const data4 = await res4.json();
            console.log('Success. Full Data:', JSON.stringify(data4, null, 2));
        } else {
            console.log('Failed:', res4.statusText);
        }
    } catch (e) {
        console.log('FaisalShohag API Error:', e.message);
    }
}
check();

