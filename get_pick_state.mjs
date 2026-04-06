import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function run() {
  const { data, error } = await supabase.from('picks')
      .select('pick_team, pick_type, pick_value, odds')
      .eq('id', 'a5882dc3-9dc0-427b-9db3-5ba70995f607');

  console.log(JSON.stringify(data, null, 2));
}
run();
