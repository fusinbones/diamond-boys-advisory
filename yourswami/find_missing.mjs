import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function run() {
  const { data, error } = await supabase.from('picks')
      .select('*')
      .gte('game_date', '2026-04-04')
      .ilike('home_team', '%Guardians%'); // or away_team

  const { data: data2 } = await supabase.from('picks')
      .select('*')
      .gte('game_date', '2026-04-04')
      .ilike('away_team', '%Guardians%');

  console.log(JSON.stringify([...(data || []), ...(data2 || [])], null, 2));
}
run();
