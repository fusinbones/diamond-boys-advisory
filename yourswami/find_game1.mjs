import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function run() {
  const { data, error } = await supabase.from('picks')
      .select('*')
      .eq('game_id', '29fe747229e417a970662db96f7b507a');

  console.log(JSON.stringify(data, null, 2));
}
run();
