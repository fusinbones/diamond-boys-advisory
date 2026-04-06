import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function run() {
  const { data, error } = await supabase.from('fire_picks')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

  fs.writeFileSync('fire_picks.json', JSON.stringify(data, null, 2));
}
run();
