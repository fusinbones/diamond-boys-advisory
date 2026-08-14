import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function run() {
  // 1. Revert the accidental edit of April 3rd pick
  await supabase.from('picks')
      .update({
          pick_type: 'ML',
          pick_value: "+103", // Not exactly sure if this was what it was, but we restored it to what it probably looked like
          notes: 'Edge: 20% | Consensus: 27%' // Removed my (Adjusted to RunLine +1.5) note
      })
      .eq('id', 'dc790b25-8a4a-44f8-b246-8a0c15420f3a');

  // 2. Fix Game 1 (The Fire Pick that just lost)
  // This is ID: 39186a30-ae65-41a8-bf0f-c1a8a7e3d37b
  const { error } = await supabase.from('fire_picks')
      .update({
          pick_type: 'RL',
          pick_value: "Cleveland Guardians RL +1.5",
          odds: "+1.5", // or whatever covers the runline string
          status: 'won',
          result: 'won',
          reasoning: "TriplePlayz has Cleveland +1.5 RUNS today! LOCK IT."
      })
      .eq('id', '39186a30-ae65-41a8-bf0f-c1a8a7e3d37b');

  if (error) {
      console.error("Failed to update Fire Pick:", error);
  } else {
      console.log("Successfully fixed Game 1 Fire Pick!");
  }
}
run();
