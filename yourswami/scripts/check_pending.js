const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function run() {
    const env = fs.readFileSync('.env.local', 'utf8');
    const uLine = env.split('\n').find(l => l.includes('NEXT_PUBLIC_SUPABASE_URL='));
    const url = uLine.split('=')[1].replace(/["'\r\n]/g, '').trim();
    
    const kLine = env.split('\n').find(l => l.includes('SUPABASE_SERVICE_KEY=')) || env.split('\n').find(l => l.includes('SUPABASE_ANON_KEY='));
    const key = kLine.split('=')[1].replace(/["'\r\n]/g, '').trim();
    
    const res = await fetch(`${url}/rest/v1/picks?result=eq.pending&select=id,game_date,matchup`, {
        headers: { apikey: key, Authorization: `Bearer ${key}` }
    });
    const pending = await res.json();
    console.log(`There are ${pending.length} pending picks.`);
    console.log(pending.slice(0, 5));
}
run();
