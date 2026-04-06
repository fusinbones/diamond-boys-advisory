import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function run() {
  // 1. Fix the injected "Today's Pick"
  await supabase.from('picks')
      .update({
          pick_value: "-130",   // This will render as "Chicago Cubs ML -130"
          odds: "-130"
      })
      .eq('id', 'a5882dc3-9dc0-427b-9db3-5ba70995f607');

  // 2. Fix the Fire Pick
  await supabase.from('fire_picks')
      .update({
          pick_team: "Chicago Cubs",
          pick_value: "Chicago Cubs ML -130",
          odds: "-130",
          reasoning: "Triple Playz has Cubs to WIN!\nLOCK IT!"
      })
      .eq('id', '23372ef7-07b7-4a2e-a19c-da8227079d60');

  console.log("Updated both UI elements!");
}
run();
