
async function check() {
    const username = 'neal_wu'; // Using a known active user
    const res = await fetch(`https://leetcode-stats-api.herokuapp.com/${username}`);
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
}
check();
