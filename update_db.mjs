import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function run() {
  // 1. Update Game 1 pick
  const { error: err1 } = await supabase.from('picks')
      .update({
          pick_type: 'RL',
          pick_value: '+1.5',
          notes: 'Edge: 20% | Consensus: 27% (Adjusted to RunLine +1.5)'
      })
      .eq('id', 'dc790b25-8a4a-44f8-b246-8a0c15420f3a');

  if (err1) console.error("Error updating Game 1:", err1);
  else console.log("Successfully updated Game 1 to CLE +1.5");

  // 2. Insert Game 2 pick
  const newPickId = crypto.randomUUID();
  const game2Pick = {
      id: newPickId,
      created_by: "AI Consensus Engine",
      game_id: "double-header-game-2-cubs-clev-" + Date.now(),
      home_team: "Cleveland Guardians",
      away_team: "Chicago Cubs",
      pick_type: "ML",
      pick_team: "Chicago Cubs",
      pick_value: "ML",
      confidence: 85,
      reason: "Live System Trigger: Cubs Game 2 Doubleheader.",
      notes: "Late addition triggered based on real-time pattern breakdown.",
      result: "pending",
      game_date: "2026-04-05",
      source: "ai_consensus",
      odds_at_pick: {
          total: null,
          moneyline: { away: -130, home: 110 }
      },
      sport: "baseball_mlb",
      unit_size: "2",
      game_time: new Date().toISOString()
  };

  const { error: err2 } = await supabase.from('picks').insert([game2Pick]);

  if (err2) console.error("Error inserting Game 2:", err2);
  else console.log("Successfully inserted Game 2 Cubs pick");
}
run();
