// scripts/fix_db_emails.ts
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

// 1. Parse .env.local natively for Vercel Next.js projects
const envFile = fs.readFileSync('.env.local', 'utf8');
const env: Record<string, string> = {};
for (const line of envFile.split('\n')) {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
        let val = match[2].trim();
        // Remove surrounding quotes if they exist
        if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
        if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
        env[match[1].trim()] = val;
    }
}

const supabaseUrl = process.argv[2] || env['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseKey = process.argv[3] || env['SUPABASE_SERVICE_KEY'];

if (!supabaseUrl || !supabaseKey) {
    console.error("Usage: npx tsx scripts/fix_db_emails.ts <URL> <KEY>");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function backfillProfiles() {
    console.log("Fetching auth.users...");
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError || !authData?.users) {
        console.error("Failed to fetch auth users:", authError);
        return;
    }

    const authUsers = authData.users;
    console.log(`Found ${authUsers.length} total auth users.`);

    console.log("Fetching user_profiles without email...");
    const { data: profiles, error: profError } = await supabase
        .from('user_profiles')
        .select('id, email, subscription_tier, trial_end')
        .is('email', null);

    if (profError) {
        console.error("Failed to fetch profiles:", profError);
        return;
    }

    console.log(`Found ${profiles?.length || 0} user_profiles missing an email. Fixing...`);

    let fixedCount = 0;
    for (const profile of profiles || []) {
        const authUser = authUsers.find(u => u.id === profile.id);
        if (authUser && authUser.email) {
            const updates: any = { email: authUser.email };
            
            // If they also missed the tier init, set defaults
            if (!profile.subscription_tier) updates.subscription_tier = 'free';
            if (!profile.trial_end) {
                const trialEnd = new Date(new Date(authUser.created_at).getTime() + 7 * 86400000);
                updates.trial_end = trialEnd.toISOString();
            }

            console.log(`Updating ${profile.id} -> ${authUser.email} (tier: ${updates.subscription_tier || 'existing'})`);
            const { error: updateError } = await supabase
                .from('user_profiles')
                .update(updates)
                .eq('id', profile.id);

            if (updateError) {
                console.error(`Failed to update ${profile.id}:`, updateError.message);
            } else {
                fixedCount++;
            }
        } else {
            console.log(`No auth user or email found for profile ${profile.id}`);
        }
    }

    console.log(`\\nFinished! Successfully backfilled ${fixedCount} users.`);
}

backfillProfiles().catch(console.error);
