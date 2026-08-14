const { createClient } = require('@supabase/supabase-js');

const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function run() {
    const { data: updated, error } = await s
        .from('picks')
        .update({ game_date: '2026-03-27' })
        .eq('source', 'ai_consensus')
        .eq('game_date', '2026-03-26')
        .select();
    
    console.log('Fixed:', updated?.length || 0, 'rows');
    if (error) console.error(error);
}

run();
