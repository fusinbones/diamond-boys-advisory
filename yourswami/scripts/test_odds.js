const fs = require('fs');

async function run() {
    const env = fs.readFileSync('.env.local', 'utf8');
    const keyLine = env.split('\n').find(l => l.includes('ODDS_API_KEY='));
    const apiKey = keyLine.split('=')[1].replace(/["'\r\n]/g, '').trim();
    
    const url = `https://api.the-odds-api.com/v4/sports/basketball_nba/scores/?daysFrom=2&apiKey=${apiKey}`;
    const res = await fetch(url);
    const data = await res.json();
    console.log('API Response:', JSON.stringify(data).substring(0, 500));
}
run();
