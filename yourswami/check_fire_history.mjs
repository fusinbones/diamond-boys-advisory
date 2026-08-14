import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function run() {
  const { data, error } = await supabase.from('fire_picks')
      .select('id, matchup, pick_team, pick_type, pick_value, status, scheduled_at, result')
      .order('scheduled_at', { ascending: false })
      .limit(10);

  console.log(JSON.stringify(data, null, 2));
}
run();
