import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function run() {
  // Update the Cubs pick to be scheduled today after Game 1
  const { error } = await supabase.from('fire_picks')
      .update({
          scheduled_at: '2026-04-05T19:55:00Z' // 3:55 PM ET today
      })
      .eq('id', '23372ef7-07b7-4a2e-a19c-da8227079d60');

  if (error) {
      console.error(error);
  } else {
      console.log('Fixed Cubs scheduled_at');
  }
}
run();
