import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function run() {
  const { data, error } = await supabase.from('picks')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
      
  const filtered = data.filter(p => JSON.stringify(p).includes("Guardians") || JSON.stringify(p).includes("Cubs"));
  fs.writeFileSync('debug_picks.json', JSON.stringify(filtered, null, 2));
}
run();
