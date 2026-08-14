const fs = require('fs');

async function run() {
    const env = fs.readFileSync('.env.local', 'utf8');
    const urlLine = env.split('\n').find(l => l.includes('NEXT_PUBLIC_SUPABASE_URL='));
    const url = urlLine.split('=')[1].replace(/["'\r\n]/g, '').trim();
    
    const keyLine = env.split('\n').find(l => l.includes('SUPABASE_SERVICE_KEY=')) || env.split('\n').find(l => l.includes('SUPABASE_ANON_KEY='));
    const key = keyLine.split('=')[1].replace(/["'\r\n]/g, '').trim();
    
    // Read the picks from today that were created by ai_consensus
    const endpoint = `${url}/rest/v1/picks?source=eq.ai_consensus&created_at=gte.2026-03-27T00:00:00Z&select=id,game_date,created_at`;
    const res = await fetch(endpoint, {
        method: 'GET',
        headers: {
            'apikey': key,
            'Authorization': `Bearer ${key}`
        }
    });
    const data = await res.json();
    console.log(`Found ${data.length} picks created today.`);
    
    if (data.length > 0) {
        console.log(`Pick 1: Date is currently -> ${data[0].game_date}`);
        console.log(`Pick 1: ID -> ${data[0].id}`);
    }
}
run();
