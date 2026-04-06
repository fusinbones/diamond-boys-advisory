import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function run() {
  const { data, error } = await supabase.from('picks')
      .select('id, pick_team, pick_value, odds, pick_type')
      .order('created_at', { ascending: false })
      .limit(10);

  fs.writeFileSync('cubs_picks.json', JSON.stringify(data, null, 2));
}
run();
