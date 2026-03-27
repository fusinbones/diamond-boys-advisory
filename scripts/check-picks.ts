import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

const envFile = fs.readFileSync('.env.local', 'utf8');
const env: Record<string, string> = {};
for (const line of envFile.split('\n')) {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) env[match[1].trim()] = match[2].trim().replace(/^['"](.*)['"]$/, '$1');
}

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseKey = env['SUPABASE_SERVICE_KEY'];

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPicks() {
    console.log("Fetching all non-pending picks...");
    const { data: graded, error: err1 } = await supabase.from('picks').select('id, result, matchup, game_date').neq('result', 'pending');
    console.log("Non-pending picks:", graded?.length);

    console.log("\nFetching all pending picks...");
    const { data: pending, error: err2 } = await supabase.from('picks').select('id, result, matchup, game_date, status').eq('result', 'pending');
    console.log("All pending picks:", pending?.length);
    const yesterday = pending?.filter(p => p.game_date && p.game_date.includes('2026-03-26'));
    console.log("Pending picks from yesterday (2026-03-26):");
    console.dir(yesterday, { depth: null });
}

checkPicks().catch(console.error);
