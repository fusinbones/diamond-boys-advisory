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

async function checkUnknown() {
    console.log("Fetching profiles without email...");
    const { data: profiles, error } = await supabase.from('user_profiles').select('*').is('email', null);
    console.log("Profiles without email:", profiles?.length);
    console.dir(profiles, { depth: null });
}

checkUnknown().catch(console.error);
