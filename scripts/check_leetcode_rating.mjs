
async function check() {
    const username = 'neal_wu';
    try {
        const res = await fetch(`https://alfa-leetcode-api.onrender.com/${username}/contest`);
        const data = await res.json();
        console.log('Contest Rating:', data.contestRating);
        console.log('Global Ranking:', data.contestGlobalRanking);
    } catch (e) { console.log('Error:', e.message); }
}
check();
