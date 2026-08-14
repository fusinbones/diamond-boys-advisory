import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function run() {
  const { data, error } = await supabase.from('picks')
      .select('*')
      .gte('created_at', '2026-04-05T16:00:00Z')
      .lte('created_at', '2026-04-05T17:00:00Z');

  console.log(JSON.stringify(data, null, 2));
}
run();
